function getErrorText(error: any) {
  if (!error) return ""
  if (typeof error === "string") return error
  if (typeof error?.message === "string") return error.message
  if (typeof error?.error_description === "string") return error.error_description
  if (typeof error?.error?.message === "string") return error.error.message
  return ""
}

export function getAuthErrorMessage(error: any): string {
  const text = getErrorText(error)
  const msg = text.toLowerCase()

  if (msg.includes("user already registered")) return "Esse e-mail já tem uma conta cadastrada."
  if (msg.includes("invalid login credentials")) return "E-mail ou senha incorretos. Verifique e tente novamente."
  if (msg.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada."
  if (msg.includes("password should be at least 6 characters")) return "A senha precisa ter pelo menos 8 caracteres."
  if (msg.includes("too many requests")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente."
  if (msg.includes("user not found")) return "Nenhuma conta encontrada com esse e-mail."
  if (msg.includes("invalid email")) return "Informe um endereço de e-mail válido."
  if (msg.includes("signup is disabled")) return "Novos cadastros estão temporariamente desativados."
  if (msg.includes("email link is invalid") || msg.includes("has expired"))
    return "O link expirou ou já foi utilizado. Solicite um novo."

  return "Algo deu errado. Tente novamente em instantes."
}
