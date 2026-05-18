import React from 'react';
import { useSystemSettings } from "../../context/SystemSettingsContext";

const AnnouncementBar = () => {
    const { settings } = useSystemSettings();

    if (!settings?.announcement_enabled || !settings?.announcement_text) {
        return null;
    }

    return (
        <>
            <style>
                {`
                    @keyframes marquee {
                        0% { transform: translateX(100vw); }
                        100% { transform: translateX(-100%); }
                    }
                    .announcement-marquee-container {
                        overflow: hidden;
                        white-space: nowrap;
                        width: 100%;
                        display: flex;
                        align-items: center;
                    }
                    .announcement-marquee-content {
                        display: inline-block;
                        /* Slower duration on mobile (default), faster on desktop */
                        animation: marquee 60s linear infinite;
                        will-change: transform;
                    }
                    @media (min-width: 768px) {
                        .announcement-marquee-content {
                            animation: marquee 40s linear infinite;
                        }
                    }
                    .announcement-marquee-container:hover .announcement-marquee-content {
                        animation-play-state: paused;
                    }
                `}
            </style>
            <div 
                className="w-full max-w-full min-w-0 h-11 shrink-0 overflow-x-hidden text-xs md:text-sm font-medium px-3 md:px-4 z-50 relative announcement-marquee-container border-0 flex items-center"
                style={{ 
                    backgroundColor: settings.announcement_bg_color || "#ff0000", 
                    color: settings.announcement_text_color || "#ffffff",
                    border: "none",
                    boxShadow: "none",
                }}
            >
                <div className="announcement-marquee-content">
                    {settings.announcement_text}
                </div>
            </div>
        </>
    );
};

export default AnnouncementBar;
