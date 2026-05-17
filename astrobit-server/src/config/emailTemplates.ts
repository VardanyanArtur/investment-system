export const emailCodeTemplate = (code: string, name?: string) => `
  <div style="font-family:Arial,sans-serif">
    <h2>Код подтверждения</h2>
    <p>${name ? `Здравствуйте, ${name}!` : "Здравствуйте!"}</p>
    <p>Ваш код подтверждения email:</p>
    <div style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</div>
    <p>Код действует 10 минут.</p>
  </div>
`;
