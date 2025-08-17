# Image Text Composer

A web application that allows users to add and customize text layers over images with real-time preview and export capabilities.


## Author 

Mohd Maroof

## Setup and Run

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Architecture

The application follows a component-based architecture with a global state management approach:

- **App Context**: Central state management for text layers, selection, and history
- **Canvas**: Handles image rendering and text layer positioning
- **Layers Panel**: Manages text layer creation, ordering, and visibility
- **Selector Panel**: Provides controls for text styling and layer properties
- **Common Components**: Reusable UI components like buttons and inputs

## Technology Choices

- **Next.js**: For React framework and server-side rendering
- **TypeScript**: For type safety and better developer experience
- **Tailwind CSS**: For utility-first styling
- **Canvas API**: For image manipulation and text rendering(taken help from google and GPT)
- **React Context**: For state management
- **Google Fonts API**: For font selection and loading

### Trade-offs

- **State Management**: Chose Context API over Redux for simplicity, though it might need refactoring for larger state
- **Canvas**: Used Canvas for better performance with multiple text layers
- **No Backend**: All processing happens in the browser, limiting file size handling

## Features

- Add and customize multiple text layers
- Real-time preview of text styling
- Layer management (reorder, delete)
- Export to PNG
- Undo/Redo functionality
- Responsive design

## Known Limitations

- Large images may cause performance issues
- Limited text styling options (no text effects like shadows/outlines)
- No image filters or adjustments
- No cloud saving functionality
- Limited font selection (currently supports a subset of Google Fonts)
- No mobile touch support for canvas interactions