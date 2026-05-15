# deploy-railway.ps1
# Deploy completo do Votta no Railway via API -- sem CLI, sem Docker.
# Uso: .\deploy-railway.ps1
#
# Pre-requisito: token em railway.app -> Account Settings -> Tokens

$ErrorActionPreference = "Stop"

$RAILWAY_API   = "https://backboard.railway.app/graphql/v2"
$GITHUB_REPO   = "LucasGasparA/Votta"
$GITHUB_BRANCH = "main"
$PROJECT_NAME  = "votta"

# --- Helpers -----------------------------------------------------------------

function Invoke-Railway {
    param([string]$Query, [hashtable]$Variables = @{})
    $body = @{ query = $Query; variables = $Variables } | ConvertTo-Json -Depth 15 -Compress
    $resp = Invoke-RestMethod -Uri $RAILWAY_API -Method POST `
        -Headers $script:headers -Body $body -ContentType "application/json"
    if ($resp.errors) {
        Write-Host "  ERRO API: $($resp.errors[0].message)" -ForegroundColor Red
        exit 1
    }
    return $resp.data
}

function Step { param([string]$n, [string]$msg)
    Write-Host ""
    Write-Host "[$n] $msg" -ForegroundColor Cyan
}

function Ok { param([string]$msg)
    Write-Host "  OK: $msg" -ForegroundColor Green
}

# --- Coletar inputs ----------------------------------------------------------

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Votta -- Deploy automatico no Railway" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Acesse: railway.app -> Account Settings -> Tokens -> Create Token" -ForegroundColor Yellow
Write-Host ""

$RAILWAY_TOKEN = Read-Host "Cole seu Railway API Token"
$script:headers = @{ Authorization = "Bearer $RAILWAY_TOKEN"; "Content-Type" = "application/json" }

Write-Host ""
Write-Host "Agora as credenciais do projeto." -ForegroundColor Yellow
Write-Host ""

$JWT_SECRET = -join ((65..90)+(97..122)+(48..57) | Get-Random -Count 48 | ForEach-Object {[char]$_})
Write-Host "JWT_SECRET gerado: $JWT_SECRET" -ForegroundColor DarkGray

Write-Host ""
Write-Host "Abra o arquivo server\credentials\votta-496123-f4737ee87954.json" -ForegroundColor Yellow
Write-Host "Copie o conteudo JSON completo (incluindo as chaves { } ) em UMA linha" -ForegroundColor Yellow
$GCP_CREDENTIALS = Read-Host "GCP_CREDENTIALS_JSON"
$GCP_PROJECT     = Read-Host "GCP_PROJECT_ID (ex: votta-496123)"

Write-Host ""
Write-Host "SMTP para reset de senha (Enter para pular e configurar depois):"
$SMTP_HOST = Read-Host "SMTP_HOST [smtp.gmail.com]"
if (-not $SMTP_HOST) { $SMTP_HOST = "smtp.gmail.com" }
$SMTP_PORT = Read-Host "SMTP_PORT [587]"
if (-not $SMTP_PORT) { $SMTP_PORT = "587" }
$SMTP_USER = Read-Host "SMTP_USER (seu email)"
$SMTP_PASS = Read-Host "SMTP_PASS (senha de app)"
$SMTP_FROM = Read-Host "SMTP_FROM (ex: Votta noreply@seudominio.com)"
if (-not $SMTP_FROM) { $SMTP_FROM = "Votta $SMTP_USER" }

# --- 1. Verificar token ------------------------------------------------------

Step "1/9" "Verificando token Railway..."
$me = Invoke-Railway "{ me { name email } }"
Ok "Conectado como $($me.me.name) ($($me.me.email))"

# --- 2. Buscar ou criar projeto -----------------------------------------------

Step "2/9" "Verificando se projeto '$PROJECT_NAME' ja existe..."
$listQuery = @"
{ me { projects { edges { node { id name defaultEnvironment { id name } } } } } }
"@
$existing = Invoke-Railway $listQuery
$existingProject = $existing.me.projects.edges | Where-Object { $_.node.name -eq $PROJECT_NAME } | Select-Object -First 1

if ($existingProject) {
    $projectId = $existingProject.node.id
    $envId     = $existingProject.node.defaultEnvironment.id
    Write-Host "  ATENCAO: Projeto '$PROJECT_NAME' ja existe (ID: $projectId)." -ForegroundColor Yellow
    $choice = Read-Host "  Usar este projeto existente? (s/n)"
    if ($choice -ne "s") {
        Write-Host "  Abortando. Delete o projeto duplicado em railway.app antes de continuar." -ForegroundColor Red
        exit 1
    }
    Ok "Usando projeto existente - ID: $projectId | Env: $envId"
} else {
    $projQuery = @"
mutation(`$input: ProjectCreateInput!) {
  projectCreate(input: `$input) {
    id
    defaultEnvironment { id name }
  }
}
"@
    $proj = Invoke-Railway $projQuery @{ input = @{ name = $PROJECT_NAME } }
    $projectId = $proj.projectCreate.id
    $envId     = $proj.projectCreate.defaultEnvironment.id
    Ok "Projeto criado - ID: $projectId | Env: $envId"
}

# --- 3. Adicionar PostgreSQL --------------------------------------------------

Step "3/9" "Adicionando PostgreSQL..."
$dbQuery = @"
mutation(`$input: DatabaseDeployInput!) {
  databaseDeploy(input: `$input) {
    serviceId
  }
}
"@
$db = Invoke-Railway $dbQuery @{ input = @{
    projectId    = $projectId
    databaseType = "POSTGRESQL"
    environmentId = $envId
    name         = "postgres"
} }

$pgServiceId = $db.databaseDeploy.serviceId
Ok "PostgreSQL criado - service ID: $pgServiceId"

# --- 4. Criar servico backend ------------------------------------------------

Step "4/9" "Criando servico backend (server/)..."
$svcQuery = @"
mutation(`$input: ServiceCreateInput!) {
  serviceCreate(input: `$input) { id name }
}
"@
$bk = Invoke-Railway $svcQuery @{ input = @{
    projectId = $projectId
    name      = "backend"
    source    = @{ repo = $GITHUB_REPO; branch = $GITHUB_BRANCH }
} }

$backendId = $bk.serviceCreate.id
Ok "Backend service ID: $backendId"

$updateQuery = @"
mutation(`$input: ServiceInstanceUpdateInput!) {
  serviceInstanceUpdate(input: `$input)
}
"@
Invoke-Railway $updateQuery @{ input = @{
    projectId       = $projectId
    environmentId   = $envId
    serviceId       = $backendId
    rootDirectory   = "server"
    buildCommand    = "npm install && npx prisma generate && npm run build"
    startCommand    = "npx prisma migrate deploy && node dist/index.js"
    healthcheckPath = "/api/health"
} } | Out-Null
Ok "Backend configurado (rootDir=server, build+start commands)"

# --- 5. Criar dominio do backend ---------------------------------------------

Step "5/9" "Gerando dominio publico do backend..."
$domainQuery = @"
mutation(`$input: ServiceDomainCreateInput!) {
  serviceDomainCreate(input: `$input) { domain }
}
"@
$bkDomain = Invoke-Railway $domainQuery @{ input = @{
    projectId     = $projectId
    environmentId = $envId
    serviceId     = $backendId
} }

$BACKEND_URL = "https://$($bkDomain.serviceDomainCreate.domain)"
Ok "Backend URL: $BACKEND_URL"

# --- 6. Criar servico frontend -----------------------------------------------

Step "6/9" "Criando servico frontend (raiz/)..."
$fe = Invoke-Railway $svcQuery @{ input = @{
    projectId = $projectId
    name      = "frontend"
    source    = @{ repo = $GITHUB_REPO; branch = $GITHUB_BRANCH }
} }

$frontendId = $fe.serviceCreate.id
Ok "Frontend service ID: $frontendId"

Invoke-Railway $updateQuery @{ input = @{
    projectId       = $projectId
    environmentId   = $envId
    serviceId       = $frontendId
    rootDirectory   = ""
    buildCommand    = "npm install && npm run build"
    startCommand    = "npx serve dist -l `$PORT"
    healthcheckPath = "/"
} } | Out-Null
Ok "Frontend configurado (rootDir=raiz, serve dist/)"

# --- 7. Criar dominio do frontend --------------------------------------------

Step "7/9" "Gerando dominio publico do frontend..."
$feDomain = Invoke-Railway $domainQuery @{ input = @{
    projectId     = $projectId
    environmentId = $envId
    serviceId     = $frontendId
} }

$FRONTEND_URL = "https://$($feDomain.serviceDomainCreate.domain)"
Ok "Frontend URL: $FRONTEND_URL"

# --- 8. Variaveis de ambiente ------------------------------------------------

Step "8/9" "Configurando variaveis de ambiente..."

$varQuery = @"
mutation(`$input: VariableCollectionUpsertInput!) {
  variableCollectionUpsert(input: `$input)
}
"@

Invoke-Railway $varQuery @{ input = @{
    projectId     = $projectId
    environmentId = $envId
    serviceId     = $backendId
    variables     = @{
        NODE_ENV             = "production"
        JWT_SECRET           = $JWT_SECRET
        FRONTEND_URL         = $FRONTEND_URL
        APP_URL              = $BACKEND_URL
        GCP_PROJECT_ID       = $GCP_PROJECT
        GCP_LOCATION         = "us-central1"
        GCP_MODEL            = "gemini-1.5-pro"
        GCP_CREDENTIALS_JSON = $GCP_CREDENTIALS
        SMTP_HOST            = $SMTP_HOST
        SMTP_PORT            = $SMTP_PORT
        SMTP_USER            = $SMTP_USER
        SMTP_PASS            = $SMTP_PASS
        SMTP_FROM            = $SMTP_FROM
    }
} } | Out-Null
Ok "Variaveis do backend configuradas"

Invoke-Railway $varQuery @{ input = @{
    projectId     = $projectId
    environmentId = $envId
    serviceId     = $frontendId
    variables     = @{
        VITE_API_URL = "$BACKEND_URL/api"
    }
} } | Out-Null
Ok "Variaveis do frontend configuradas"

# --- 9. Linkar DATABASE_URL --------------------------------------------------

Step "9/9" "Linkando DATABASE_URL do PostgreSQL ao backend..."
Invoke-Railway $varQuery @{ input = @{
    projectId     = $projectId
    environmentId = $envId
    serviceId     = $backendId
    variables     = @{
        DATABASE_URL = "`${{Postgres.DATABASE_URL}}"
    }
} } | Out-Null
Ok "DATABASE_URL linkada via referencia Railway"

# --- Resumo ------------------------------------------------------------------

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Configuracao concluida!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend  : $FRONTEND_URL" -ForegroundColor Cyan
Write-Host "  Backend   : $BACKEND_URL" -ForegroundColor Cyan
Write-Host "  API Health: $BACKEND_URL/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "O Railway vai iniciar os builds automaticamente." -ForegroundColor Yellow
Write-Host "Acompanhe em: https://railway.app/project/$projectId" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANTE: Guarde o JWT_SECRET:" -ForegroundColor Red
Write-Host "  JWT_SECRET = $JWT_SECRET" -ForegroundColor DarkGray
Write-Host ""

