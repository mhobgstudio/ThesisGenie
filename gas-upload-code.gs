/**
 * ThesisGenie - File Uploader for Google Drive
 * =============================================
 * 
 * HOW TO DEPLOY:
 * 1. Go to https://script.google.com
 * 2. Click "New project"
 * 3. Delete any default code, paste this entire file
 * 4. Click Deploy → New Deployment
 * 5. Type: Web App
 * 6. Execute as: Me
 * 7. Access: Anyone (this allows your website to upload files)
 * 8. Click Deploy
 * 9. Copy the "Web App URL" (looks like: https://script.google.com/macros/s/.../exec)
 * 10. Paste that URL into your website's GAS_UPLOAD_URL
 *
 * The folder ID below is your Google Drive folder where files will be saved.
 * From your URL: https://drive.google.com/drive/folders/1cXAOV7W4j2tz1nqww2-72ZtB_Tt-X6cA
 * The folder ID is: 1cXAOV7W4j2tz1nqww2-72ZtB_Tt-X6cA
 */

const FOLDER_ID = '1cXAOV7W4j2tz1nqww2-72ZtB_Tt-X6cA';

/**
 * Accepts file uploads via POST multipart/form-data
 * Saves the file to the configured Google Drive folder
 * Returns HTML with postMessage to communicate file URL back to the parent page
 */
function doPost(e) {
  try {
    // Allow overriding folder via form field (fallback to default)
    const folderId = (e.parameter && e.parameter.folderId) || FOLDER_ID;
    const folder = DriveApp.getFolderById(folderId);
    
    // Get uploaded file from form data
    // When multipart/form-data is used, file inputs become Blobs in e.parameter
    const fileBlob = e.parameter.uploadedFile;
    
    if (!fileBlob) {
      return sendResult(false, 'No file received - upload field may be empty');
    }
    
    // Check if it's a real Blob (has getName method)
    if (typeof fileBlob.getName !== 'function') {
      return sendResult(false, 'Uploaded data is not a valid file');
    }
    
    // Create the file in the designated Drive folder
    const file = folder.createFile(fileBlob);
    
    // Return success with file details
    return sendResult(true, '', {
      fileUrl: file.getUrl(),
      fileName: file.getName(),
      fileId: file.getId()
    });
    
  } catch (error) {
    return sendResult(false, error.toString());
  }
}

/**
 * Sends a result back to the parent window via HTML + postMessage
 */
function sendResult(success, error, data) {
  const result = {
    success: success,
    error: error,
    fileUrl: data ? data.fileUrl : '',
    fileName: data ? data.fileName : '',
    fileId: data ? data.fileId : ''
  };
  
  const json = JSON.stringify(result);
  
  // Use \x3c to avoid breaking the HTML parser with </script>
  const html = '<script>window.parent.postMessage(' + json + ', "*");\x3c/script>' +
    '<p>Upload complete. You can close this tab.</p>';
  
  return HtmlService.createHtmlOutput(html);
}

/**
 * Simple GET handler to verify the service is running
 */
function doGet() {
  return HtmlService.createHtmlOutput(
    '<h2>✓ ThesisGenie File Upload Service</h2>' +
    '<p>Status: <strong style="color:green">Active</strong></p>' +
    '<p>This endpoint accepts file uploads via POST multipart/form-data.</p>' +
    '<p>Uploaded files are saved to the configured Google Drive folder.</p>'
  );
}
