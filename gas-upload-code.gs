/**
 * ThesisGenie - File Uploader for Google Drive
 * =============================================
 * 
 * HOW TO DEPLOY:
 * 1. Go to https://script.google.com
 * 2. Open your existing "ThesisGenie Uploader" project
 * 3. Replace ALL code with this file
 * 4. Click Deploy → Manage Deployments
 * 5. Click the existing deployment → Edit pencil icon
 * 6. Select "New version" under Version
 * 7. Click Deploy
 * 8. The URL stays the same! No need to update the website.
 *
 * The folder ID below is your Google Drive folder.
 * From your URL: https://drive.google.com/drive/folders/1cXAOV7W4j2tz1nqww2-72ZtB_Tt-X6cA
 * The folder ID is: 1cXAOV7W4j2tz1nqww2-72ZtB_Tt-X6cA
 */

const FOLDER_ID = '1cXAOV7W4j2tz1nqww2-72ZtB_Tt-X6cA';

/**
 * Accepts file uploads via POST
 * Supports TWO methods:
 *   1. Standard multipart/form-data file upload (field: uploadedFile)
 *   2. Base64-encoded text fields (fields: fileData, fileName, fileType)
 */
function doPost(e) {
  try {
    const folderId = (e.parameter && e.parameter.folderId) || FOLDER_ID;
    const folder = DriveApp.getFolderById(folderId);
    
    var file;
    
    // METHOD 1: Try multipart file upload first
    const fileBlob = e.parameter.uploadedFile;
    if (fileBlob && typeof fileBlob.getName === 'function') {
      file = folder.createFile(fileBlob);
      return sendSuccess(file);
    }
    
    // METHOD 2: Fallback to base64 text upload (more reliable)
    const base64Data = e.parameter.fileData;
    const fileName = e.parameter.fileName || 'uploaded-file';
    const fileType = e.parameter.fileType || 'application/octet-stream';
    
    if (base64Data && base64Data.length > 0) {
      const decoded = Utilities.base64Decode(base64Data);
      const blob = Utilities.newBlob(decoded, fileType, fileName);
      file = folder.createFile(blob);
      return sendSuccess(file);
    }
    
    return sendError('No file received - upload field may be empty');
    
  } catch (error) {
    return sendError(error.toString());
  }
}

function sendSuccess(file) {
  return sendResult(true, '', {
    fileUrl: file.getUrl(),
    fileName: file.getName(),
    fileId: file.getId()
  });
}

function sendError(msg) {
  return sendResult(false, msg, {});
}

function sendResult(success, error, data) {
  const result = {
    success: success,
    error: error,
    fileUrl: data.fileUrl || '',
    fileName: data.fileName || '',
    fileId: data.fileId || ''
  };
  
  const json = JSON.stringify(result);
  
  // Return HTML with postMessage to communicate back to parent page
  const html = '<script>window.parent.postMessage(' + json + ', "*");\x3c/script>' +
    '<p>Upload complete. You can close this tab.</p>';
  
  return HtmlService.createHtmlOutput(html);
}

function doGet() {
  return HtmlService.createHtmlOutput(
    '<h2>✓ ThesisGenie File Upload Service</h2>' +
    '<p>Status: <strong style="color:green">Active</strong></p>' +
    '<p>Accepts multipart file uploads and base64-encoded uploads.</p>'
  );
}
