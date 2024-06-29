export async function isPasswordValid(
  password: string,
  hashedPassword: string
) {
  return (await hashPassword(password)) === hashedPassword;
}

async function hashPassword(password: string) {
  const arrayBuffer = crypto.subtle.digest(
    "SHA-512",
    new TextEncoder().encode(password)
  );
  return Buffer.from(await arrayBuffer).toString("base64");
}
