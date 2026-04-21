const fs = require('fs');
const path = require('path');

function getMapAssetPath(mapName) {
    const basePath = path.join(__dirname, '../../public/GameAssets/Maps/g1046');
    const filePath = path.join(basePath, mapName);
    
    // Security check to prevent directory traversal
    if (!filePath.startsWith(path.resolve(basePath))) {
        throw new Error('Invalid file path');
    }
    
    if (!fs.existsSync(filePath)) {
        throw new Error('Map file not found');
    }
    
    return filePath;
}

module.exports = {
    getMapAssetPath
};
