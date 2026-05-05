function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === 'createFolder') {
      var parentFolder = DriveApp.getFolderById(data.parentId);
      var newFolder = parentFolder.createFolder(data.folderName);
      
      // Make it accessible to anyone with the link
      newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        folderId: newFolder.getId(),
        folderUrl: newFolder.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'uploadFile') {
      var folder = DriveApp.getFolderById(data.folderId);
      var blob = Utilities.newBlob(Utilities.base64Decode(data.base64Data), data.mimeType, data.fileName);
      var newFile = folder.createFile(blob);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        fileId: newFile.getId(),
        fileUrl: newFile.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Invalid action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("OK");
}
