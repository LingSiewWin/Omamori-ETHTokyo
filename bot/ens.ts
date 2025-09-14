// ENS Integration for OMAMORI
// Mock implementation for demo purposes

export interface ENSFrame {
  subdomain: string;
  frame: {
    image: string;
    button: string;
    url: string;
  };
}

export async function createSubdomain(user: string, goal: string): Promise<ENSFrame> {
  // Mock ENS subdomain creation
  // In production, this would interact with ENS contracts

  const sanitizedGoal = goal.toLowerCase().replace(/[^a-z0-9]/g, '');
  const subdomain = `${sanitizedGoal}.omamori.eth`;

  const frame: ENSFrame = {
    subdomain,
    frame: {
      image: 'ipfs://QmYourHashHere/seed.png', // Mock IPFS hash
      button: 'View Progress 🌸',
      url: `https://omamori.app/share/${subdomain}`
    }
  };

  console.log(`🌐 Created ENS frame for ${user}: ${subdomain}`);
  return frame;
}

export function generateFrameMessage(frame: ENSFrame): string {
  return `🌸 お守りを共有しましょう！\n\n` +
    `ENS: ${frame.subdomain}\n` +
    `プロフィール: ${frame.frame.url}\n\n` +
    `友達に進捗を見せて、一緒に目標を達成しましょう！✨`;
}

// Mock ENS Frame HTML for sharing
export function generateFrameHTML(subdomain: string, goal: string, progress: number): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OMAMORI - ${goal}への道</title>
    <meta property="og:title" content="OMAMORI - ${goal}への道">
    <meta property="og:description" content="${progress}%達成！一緒に目標を達成しよう！">
    <meta property="og:image" content="https://omamori.app/api/frame-image/${subdomain}">
    <style>
        body {
            font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif;
            background: linear-gradient(135deg, #ffeef8 0%, #f0e6ff 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
        }
        .omamori-card {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
        }
        .progress-bar {
            background: #f0f0f0;
            border-radius: 10px;
            overflow: hidden;
            height: 20px;
            margin: 1rem 0;
        }
        .progress-fill {
            background: linear-gradient(90deg, #ff9a8b, #fecfef);
            height: 100%;
            width: ${progress}%;
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="omamori-card">
        <h1>🌸 OMAMORI 🌸</h1>
        <h2>${goal}への道</h2>
        <div class="text-6xl mb-4">
            ${progress < 25 ? '🌱' : progress < 50 ? '🌸' : progress < 75 ? '🌺' : '🌹'}
        </div>
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
        <p><strong>${progress}%達成！</strong></p>
        <p>一緒に目標を達成しよう！</p>
        <div style="margin-top: 2rem; color: #666;">
            ${subdomain}
        </div>
    </div>
</body>
</html>`;
}