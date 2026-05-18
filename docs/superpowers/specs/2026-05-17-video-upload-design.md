# VendFinder Video Upload Feature Design

**Date:** May 17, 2026  
**Status:** Approved Design  
**Implementation Approach:** Progressive (Phase 1 → Phase 2)

## Overview

Enable vendors to upload and display videos across the VendFinder platform to showcase their products more effectively. Hair vendors want to demonstrate styling processes, texture details, and product application through video content.

## Requirements Summary

- **Scope:** All vendors get immediate access (no premium restrictions)
- **Display Locations:** Product detail pages, product listings, vendor profiles, Stories integration
- **File Constraints:** 30MB max, 2 minutes max, 720p max resolution
- **Upload Flow:** Integrated with existing product creation/edit forms
- **Success Metrics:** Usage rates, business impact (conversion/engagement), user experience quality

## Technical Approach

**Strategy:** Progressive Implementation
- **Phase 1:** Minimal viable extension of existing upload system
- **Phase 2:** Enhanced processing pipeline based on usage data

**Deployment Constraint:** Build incrementally on existing droplet infrastructure, preserve all API keys and configurations.

## Architecture & Data Model

### Database Changes
**No schema changes required.** Extend existing `products.media` JSONB field:

```json
{
  "images": [{"url": "...", "alt": "...", "sort_order": 1}],
  "videos": [{"url": "...", "thumbnail": "...", "duration": 120, "size": 25000000, "sort_order": 1}]
}
```

### Storage Strategy
- **Phase 1:** Direct file storage using existing S3/storage system
- **File Path:** `/uploads/products/{vendor_id}/videos/{uuid}-{filename}.mp4`
- **Phase 2:** Add CDN and processing pipeline

### Validation Rules
- **File Types:** `.mp4`, `.mov`, `.avi` only
- **Max Size:** 30MB
- **Max Duration:** 2 minutes (client-side validation)
- **Max Resolution:** 720p

## Phase 1 Implementation

### Frontend Integration
- **Extend existing product upload component** to include video upload alongside images
- **Reuse existing upload patterns** from `/src/lib/api-products.ts`
- **Add video-specific validation** in same form component
- **Backwards Compatible:** All existing functionality preserved

### API Changes

#### New Endpoint: `/api/uploads/product-videos/route.ts`
```typescript
// Clone of existing product-images route with video-specific validation
export async function POST(request: NextRequest) {
  // Reuse existing auth header pattern
  // Add video file type validation (.mp4, .mov, .avi)
  // Add 30MB size limit
  // Proxy to API gateway: `${API_BASE_URL}/api/uploads/product-videos`
}
```

#### Backend Service Extensions
- **Extend existing upload handler** for video file types
- **Reuse existing S3/storage configuration**
- **Add video metadata extraction** (duration, dimensions)
- **No breaking changes** to existing product APIs

#### Response Format
```json
{
  "success": true,
  "videoUrl": "https://storage.../video.mp4",
  "metadata": {
    "duration": 120,
    "size": 25000000,
    "format": "mp4"
  }
}
```

### Frontend Components

#### New Components
**ProductVideoPlayer.tsx**
- Basic HTML5 `<video>` element with controls
- Fallback thumbnail if video fails to load
- Mobile-optimized (preload="none")
- Reuses existing image styling patterns

#### Extended Components
**ProductCard.tsx**
- Add video indicator badge when product has videos
- Click to play video preview in modal
- Falls back to existing image-only display

**Product Detail Page**
- Extend existing image carousel to include videos
- Video thumbnails in carousel navigation
- Full-screen video modal (reuse existing image modal pattern)

#### Integration Points
- **Stories:** Product videos can be shared to Stories
- **Vendor Profiles:** Show recent product videos in showcase
- **Search Results:** Video badge indicator on product cards

#### Performance Considerations
- Videos load only when user clicks to play (no auto-play)
- Use existing lazy loading patterns
- Mobile-first responsive design

### Upload Flow
1. User selects video file in product form (same UI pattern as images)
2. Client validates file size/type before upload
3. Upload to `/api/uploads/product-videos` (mirrors image upload)
4. Success response includes video URL
5. Video metadata added to product's `media.videos` array
6. Product save includes all media (images + videos)

## Phase 2 Enhancement Plan

### Trigger Conditions
- Video upload adoption hits 20% of active vendors
- OR video-enabled products show 15%+ higher conversion
- OR user feedback indicates performance/UX issues

### Enhanced Features

#### Video Processing Pipeline
- **Automatic thumbnail generation** at upload time
- **Video compression** to optimize file sizes
- **Multiple quality levels** (720p, 480p, 360p for mobile)
- **Progressive loading** and streaming optimization

#### Enhanced Analytics
- **Video engagement tracking** (play rates, completion rates)
- **A/B testing framework** for video vs image-only products
- **Vendor dashboard metrics** showing video performance impact

#### Advanced UX Features
- **Auto-play preview** in product listings (muted)
- **Video SEO optimization** (video sitemaps, schema markup)
- **Bulk video management** tools for power vendors

#### Performance Optimization
- **CDN integration** for global video delivery
- **Adaptive streaming** based on connection speed
- **Background processing** queue for video optimization

### Migration Strategy
- Phase 2 builds on Phase 1 without breaking changes
- Existing videos get processed retroactively
- New features are opt-in initially

## Success Metrics

### Usage Metrics
- Percentage of vendors uploading videos
- Videos per product ratio
- Upload success/failure rates

### Business Impact
- Conversion rate comparison (videos vs images-only)
- Engagement metrics (time on product pages)
- Sales performance of video-enabled products

### User Experience
- Upload completion rates and times
- Support ticket volume
- Vendor satisfaction surveys

## Risk Mitigation

### Technical Risks
- **File size impact on load times:** Conservative 30MB limit, Phase 2 compression
- **Storage costs:** Monitor usage, implement cleanup for deleted products
- **Browser compatibility:** HTML5 video with fallback handling

### Business Risks
- **Low adoption:** All vendors get access, no barriers to entry
- **Performance degradation:** Lazy loading, click-to-play strategy
- **Content quality:** Guidelines and moderation tools in Phase 2

## Dependencies

### Internal Dependencies
- Existing upload infrastructure (S3, API Gateway)
- Product CRUD APIs
- Frontend component library

### External Dependencies
- None for Phase 1 (uses existing storage)
- Phase 2 may require video processing service

## Timeline Estimate

### Phase 1: 3-4 weeks
- Week 1: Backend API extensions
- Week 2: Frontend upload integration
- Week 3: Video display components
- Week 4: Testing and deployment

### Phase 2: 6-8 weeks (after user feedback)
- Video processing pipeline development
- Analytics integration
- Performance optimizations
- Advanced UX features

## Deployment Strategy

- **Incremental deployment** on existing droplet
- **Feature flag controlled** rollout
- **Backwards compatible** at all stages
- **Preserve existing API keys** and configurations
- **No infrastructure rebuilds** required

## Appendix

### File Type Support Matrix
| Format | Phase 1 | Phase 2 | Notes |
|--------|---------|---------|-------|
| .mp4   | ✅      | ✅      | Primary format |
| .mov   | ✅      | ✅      | Apple devices |
| .avi   | ✅      | ✅      | Legacy support |
| .webm  | ❌      | ✅      | Web-optimized |

### Browser Compatibility
- HTML5 video support (95%+ browsers)
- Graceful degradation for unsupported formats
- Mobile-optimized controls and sizing