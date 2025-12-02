# Photography Portfolio

A minimalist and visually appealing React/TypeScript application for uploading and showcasing photography work.

## Features

- Drag and drop photo upload functionality
- Image preview after upload
- Progress indicators during upload
- Responsive design that works on all devices
- Clean, minimalist interface focused on your photography

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone or download this repository
2. Navigate to the project directory: `cd photography-portfolio`
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`

### Usage

1. Click the "Select Photos" button or drag and drop images into the upload area
2. Watch the progress bar as your photos upload
3. View your uploaded photos in the gallery section
4. Remove photos as needed using the remove button

## Technologies Used

- React
- TypeScript
- Vite (bundler)
- CSS (styling)

## Project Structure

```
photography-portfolio/
├── src/
│   ├── components/
│   │   ├── UploadPhotos.tsx
│   │   └── UploadPhotos.css
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tsconfig.node.json
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check for code issues