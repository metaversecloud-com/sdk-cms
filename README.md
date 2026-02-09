# CMS (Content Management System)

## Introduction / Summary

CMS is a Content Management System application built on the Topia SDK that allows world administrators to curate and manage featured content within a Topia world. Admins can search for assets, attach web links to them, and display featured content to visitors who can view and teleport to the featured assets.

## Built With

### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

## Key Features

### User Features
- **Featured Content Display**: View a list of admin-curated featured content
- **Content Cards**: Each item displays thumbnail, name, and number of attached links
- **Teleportation**: Click to teleport directly to any featured asset in the world
- **Link Access**: View and open attached links for each asset

### Canvas Elements & Interactions

- **Key Asset**: When clicked, opens the drawer and allows users and admins to interact with the app

### Admin Features

- **Access**: Click on the key asset to open the drawer. Admins see the search interface with management controls
- **Asset Search**: Real-time partial-match search for dropped assets by unique name
- **Content List Management**:
  - Add/remove assets from the featured content list
  - "Remove all items" - clears the content list
  - "Reset Content List" - clears list and removes all links from assets
- **Link Management**: Attach up to 20 clickable links per asset with:
  - URL (with validation)
  - Link Title
  - Display Mode: Drawer, Modal, or New Tab
  - Live link previews with metadata extraction

### Data Objects

**World Data Object**:
```typescript
{
  droppedAssets: {
    [assetId]: {
      id: string,
      uniqueName: string,
      topLayerURL: string,      // Thumbnail
      bottomLayerURL: string,
      assetName: string,
      links: LinkObject[],
      profileId: string         // Admin who last modified
    }
  }
}
```

**Link Structure**:
```typescript
{
  clickableLink: string,        // Full URL
  clickableLinkTitle: string,   // Display label
  isForceLinkInIframe: boolean, // Modal mode
  isOpenLinkInDrawer: boolean,  // Drawer mode
  linkId: string
}
```

## Developers

### Getting Started

- Clone this repository
- Run `npm i` in server
- `cd client`
- Run `npm i` in client
- `cd ..` back to server

### Add your .env environmental variables

```
API_KEY=xxxxxxxxxxxxx
INSTANCE_DOMAIN=api.topia.io
INSTANCE_PROTOCOL=https
INTERACTIVE_KEY=xxxxxxxxxxxxx
INTERACTIVE_SECRET=xxxxxxxxxxxxxx
```

### Where to find API_KEY, INTERACTIVE_KEY and INTERACTIVE_SECRET

[Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)

[Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- [TicTacToe example - GitHub](https://github.com/metaversecloud-com/sdk-tictactoe)
- [TicTacToe example - Demo](https://topia.io/tictactoe-prod)
