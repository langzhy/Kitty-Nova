# Kitty Nova Defense (Kitty新星防御)

A classic missile command style tower defense game where you protect your cities from falling rockets.

## Features
- **Dynamic Starry Background**: Beautiful twinkling stars that create an immersive space atmosphere.
- **Shield System**: Earn shields every 5 levels to protect your cities and turrets.
- **Bilingual Support**: Toggle between English and Chinese.
- **Responsive Design**: Works on both desktop and mobile devices.

## Deployment to Vercel

To deploy this game to Vercel via GitHub, follow these steps:

1. **Create a GitHub Repository**:
   - Go to [GitHub](https://github.com) and create a new repository named `kitty-nova-defense`.
   - Push this code to your repository.

2. **Connect to Vercel**:
   - Go to [Vercel](https://vercel.com).
   - Click **"Add New"** -> **"Project"**.
   - Import your `kitty-nova-defense` repository.
   - Vercel will automatically detect the Vite framework.
   - Click **"Deploy"**.

3. **Environment Variables**:
   - If you use any Gemini API features in the future, make sure to add `GEMINI_API_KEY` to the Vercel project settings under **Environment Variables**.

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## License
MIT
