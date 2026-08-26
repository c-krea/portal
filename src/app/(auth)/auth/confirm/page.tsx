import { AuthCard } from "./auth-card"
import { HashConfirm } from "./hash-confirm"
import { TokenConfirmForm } from "./token-form"

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ""
  return value ?? ""
}

export default async function AuthConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const tokenHash = first(params.token_hash)
  const type = first(params.type) || "recovery"

  if (tokenHash) {
    return (
      <AuthCard>
        <TokenConfirmForm tokenHash={tokenHash} type={type} />
      </AuthCard>
    )
  }

  return <HashConfirm />
}
