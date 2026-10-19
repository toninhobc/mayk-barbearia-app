# Dom Cabral Barbearia — App

Proposta de aplicativo para a [Dom Cabral Barbearia](https://domcabralbarbearia.com.br/) (Brasília, 9 unidades): escolha da unidade, agendamento, pagamento por Pix e programa de fidelidade, com o visual de pub clássico da marca (madeira, couro e dourado).

> **Status:** demonstração clicável sem backend. Unidades, endereços, telefones, horários e serviços vêm do site; barbeiros, preços e durações são **exemplos**. Pagamentos e SMS são simulados.

## Estrutura

```
app/        Aplicativo (Expo + React Native + TypeScript)
design/     Conceito visual aprovado (conceito.png / conceito.html)
*.jpg       Imagens de referência (logo, fotos)
```

Detalhes do app em `app/src/`:

| Pasta | Conteúdo |
|---|---|
| `app/` | Telas (cada arquivo é uma rota do Expo Router) |
| `components/` | Peças visuais reutilizáveis (`ui.tsx`, `cards.tsx`) |
| `store/` | Estado global (Zustand): agendamentos, rascunho, pontos |
| `lib/` | Regras: horários livres (`availability.ts`) e formatação |
| `data/` | Unidades, serviços, preços, barbeiros (`mock.ts`) e fotos (`photos.ts`) |
| `theme.ts` | Cores, fontes e espaçamentos |

## Como rodar

Pré-requisito: [Node.js](https://nodejs.org) 20 ou superior.

```bash
cd app
npm install
npx expo start
```

- **iPhone/Android:** instale o app **Expo Go** e escaneie o QR code (mesma rede Wi-Fi, ou use `npx expo start --tunnel`).
- **Navegador:** pressione `w` no terminal.
- No Windows, se o PowerShell bloquear o `npx`, use `npx.cmd`.

Verificar tipos antes de enviar mudanças:

```bash
npx tsc --noEmit
```

## Fluxo de trabalho

1. Crie um branch para cada mudança: `git checkout -b nome-da-mudanca`
2. Faça commits pequenos e descritivos.
3. Abra um Pull Request para `main` e peça revisão.
