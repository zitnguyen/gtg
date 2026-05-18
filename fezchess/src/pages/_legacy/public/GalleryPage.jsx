/**
 * @legacy Trang public mock Unsplash; media thật qua CMS (posts, Public CMS).
 * Không gắn route; không phải admin media library.
 */
import React from 'react';

const GalleryPage = () => {
    // Mock images
    const images = [
        "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1610631066894-62452ccb927c?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1580541832626-d297a7321684?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1565514020176-87d7756fce6e?auto=format&fit=crop&q=80&w=1000",
    ];

  return (
    <div style={{maxWidth:'1280px', margin:'0 auto', padding:'48px 24px'}}>
      <div className="text-center mb-8">
        <h1 className="section-title" style={{marginBottom:'16px'}}>Hình Ảnh Hoạt Động</h1>
        <p style={{fontSize:'18px', color:'#4B5563'}}>Những khoảnh khắc đáng nhớ của thầy và trò tại Z Chess</p>
      </div>

      <div className="gallery-grid">
        {images.map((src, index) => (
            <div key={index} className="gallery-item">
                <img 
                    src={src} 
                    alt={`Z Chess Activity ${index + 1}`} 
                />
            </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryPage;
