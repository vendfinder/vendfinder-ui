import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('document') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Mock successful upload response for testing
    console.log(`📄 Mock upload: ${file.name} (${file.size} bytes)`);

    return NextResponse.json({
      success: true,
      status: 'uploaded',
      documentId: 'mock-doc-' + Date.now(),
      message: 'Document uploaded successfully. Processing will begin shortly.',
      document: {
        id: 'mock-doc-' + Date.now(),
        fileName: file.name,
        fileSize: file.size,
        documentType: formData.get('documentType') || 'drivers_license',
        uploadStatus: 'uploaded',
        processingStatus: 'pending',
        verificationStatus: 'pending',
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
