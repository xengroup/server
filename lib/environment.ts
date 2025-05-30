// Verificar se estamos em um ambiente de desenvolvimento ou preview
export const isDevelopmentOrPreview =
  process.env.NODE_ENV === "development" ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar se temos acesso à chave de serviço do Supabase
export const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

// Verificar se estamos em modo de preview sem ambiente completo
export const isPreviewMode = isDevelopmentOrPreview && !hasServiceRoleKey
