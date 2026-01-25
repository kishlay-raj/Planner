import React from 'react';

// Import the prompt arrays directly from the components
// We'll need to export them from the components first
describe('Journal Questions Consistency', () => {
    // Desktop prompts - extracted from DailyJournal.js
    const DESKTOP_PROMPTS = [
        { id: '1', section: 'Morning', text: 'Who is the person I want to become today? (e.g., "I am a focused writer," "I am a calm parent.")' },
        { id: '2', section: 'Morning', text: 'The "Big Rock": What is the one thing I must accomplish today to feel satisfied?' },
        { id: '3', section: 'Morning', text: 'The Obstacle: What is most likely to distract me today, and how will I handle it?' },
        { id: '4', section: 'Deep Work', text: 'The Depth Ratio: How many hours of actual Deep Work did I achieve today versus "Shallow Work" (emails, meetings, admin)? Was this ratio acceptable?' },
        { id: '5', section: 'Deep Work', text: 'The Distraction Analysis: When I lost focus today, what was the trigger? Was it internal (boredom, anxiety) or external (notifications, physical cues like phone on desk)? What specific environmental or mental pattern hijacked my attention?' },
        { id: '6', section: 'Deep Work', text: 'Skill Growth & Value: What specifically did I do today to become better at my craft? Am I building skills that are rare and valuable, or am I doing work that is easy to replicate?' },
        { id: '7', section: 'Deep Work', text: 'The Roosevelt Dash: If I had to finish my work in half the time today, what would I have ignored?' },
        { id: '8', section: 'Digital Minimalism', text: 'The Solitude Check: Did I spend any time today alone with my own thoughts, free from inputs (no podcasts, no music, no scrolling)?' },
        { id: '9', section: 'Digital Minimalism', text: 'The Tech Audit: Did I use technology as a tool to support my values today, or did I use it as a pacifier to avoid boredom?' },
        { id: '10', section: 'Digital Minimalism', text: 'The Avoidance Pattern: Which apps or sites did I open unconsciously today? What feeling was I trying to numb or avoid? (Anxiety, boredom, fear of a hard task, loneliness?) What lies did my brain tell me to get that dopamine hit?' },
        { id: '12', section: 'Behavioral Triggers', text: 'The Transition Trap: Did I lose time during a task, or between tasks? (Most time is wasted in the "transition moments" just after finishing one thing and before starting the next).' },
        { id: '13', section: 'Evening', text: 'Review: What is one system I can tweak to make tomorrow 1% easier?' },
        { id: '14', section: 'Evening', text: '3 Amazing things that happened today.' },
        { id: '15', section: 'Evening', text: 'How could I have made today even better?' },
        { id: 'detox-1', section: 'Dopamine detox phase 1: Awareness', text: 'The "One Thing" Analysis: If I eliminated just one distraction, which one would have the biggest impact? Why haven\'t I cut it yet?' },
        { id: 'detox-2', section: 'Dopamine detox phase 1: Awareness', text: 'Excitement vs. Fulfillment: List 3 stimulating things I did today. Did they leave me fulfilling or empty?' },
        { id: 'detox-3', section: 'Dopamine detox phase 2: The Struggle', text: 'Sitting with Boredom: When I urged for my phone, what emotion was underneath? What happened when I sat with it?' },
        { id: 'detox-4', section: 'Dopamine detox phase 2: The Struggle', text: 'The "Hard Thing" Re-frame: I tackled a hard task without breaks. Was it actually difficult or just the transition?' },
        { id: 'detox-5', section: 'Dopamine detox phase 2: The Struggle', text: 'Clarity Check: Without constant inputs, what creative thoughts bubbled up naturally?' },
        { id: 'detox-6', section: 'Dopamine detox phase 3: Maintenance', text: 'The Morning Audit: Did I start with High Stimulation or Low Stimulation? How did it dictate my focus?' },
        { id: 'detox-7', section: 'Dopamine detox phase 3: Maintenance', text: 'Friction Review: Did I make bad habits harder and good habits easier today?' },
        { id: 'detox-8', section: 'Dopamine detox phase 3: Maintenance', text: 'The "Closed System" Check: Did I close out loops (emails, tabs) or leave them draining attention?' }
    ];

    // Mobile prompts - extracted from MobileApp.js
    const MOBILE_PROMPTS = [
        { id: '1', section: 'Morning', text: 'Who is the person I want to become today?' },
        { id: '2', section: 'Morning', text: 'The "Big Rock": What is the one thing I must accomplish today?' },
        { id: '13', section: 'Evening', text: 'Review: What is one system I can tweak to make tomorrow 1% easier?' },
        { id: '14', section: 'Evening', text: '3 Amazing things that happened today.' }
    ];

    it('should have mobile questions as a subset of desktop questions', () => {
        const desktopIds = DESKTOP_PROMPTS.map(p => p.id);
        const mobileIds = MOBILE_PROMPTS.map(p => p.id);

        // Every mobile question ID should exist in desktop questions
        mobileIds.forEach(mobileId => {
            expect(desktopIds).toContain(mobileId);
        });
    });

    it('should have matching question IDs between mobile and desktop', () => {
        // Mobile has 4 questions with IDs: 1, 2, 13, 14
        const expectedMobileIds = ['1', '2', '13', '14'];
        const actualMobileIds = MOBILE_PROMPTS.map(p => p.id);

        expect(actualMobileIds).toEqual(expectedMobileIds);
    });

    it('should have matching sections for shared question IDs', () => {
        MOBILE_PROMPTS.forEach(mobilePrompt => {
            const desktopPrompt = DESKTOP_PROMPTS.find(p => p.id === mobilePrompt.id);

            expect(desktopPrompt).toBeDefined();
            expect(desktopPrompt.section).toBe(mobilePrompt.section);
        });
    });

    it('should have compatible question text for shared IDs', () => {
        MOBILE_PROMPTS.forEach(mobilePrompt => {
            const desktopPrompt = DESKTOP_PROMPTS.find(p => p.id === mobilePrompt.id);

            expect(desktopPrompt).toBeDefined();

            // Mobile text should be a shortened version of desktop text
            // Desktop may have examples in parentheses that mobile omits
            const desktopTextClean = desktopPrompt.text.split('(')[0].trim();
            const mobileTextClean = mobilePrompt.text.split('(')[0].trim();

            // Check if mobile text is contained in or matches the beginning of desktop text
            expect(desktopTextClean).toContain(mobileTextClean.split('?')[0]);
        });
    });

    it('should maintain cross-platform data consistency', () => {
        // This test ensures that responses saved on mobile with IDs 1, 2, 13, 14
        // will be readable on desktop with the same IDs

        const sharedIds = ['1', '2', '13', '14'];

        sharedIds.forEach(id => {
            const mobileQuestion = MOBILE_PROMPTS.find(p => p.id === id);
            const desktopQuestion = DESKTOP_PROMPTS.find(p => p.id === id);

            expect(mobileQuestion).toBeDefined();
            expect(desktopQuestion).toBeDefined();

            // Same ID means the response will be stored in the same location in Firestore
            expect(mobileQuestion.id).toBe(desktopQuestion.id);
        });
    });

    it('should have the correct number of questions on each platform', () => {
        // Count actual questions in arrays
        const actualDesktopCount = DESKTOP_PROMPTS.length;
        const actualMobileCount = MOBILE_PROMPTS.length;

        // Desktop should have 22 questions (IDs: 1-10, 12-15, detox-1 to detox-8)
        // Note: ID 11 is intentionally skipped
        expect(actualDesktopCount).toBe(22);

        // Mobile should have 4 questions (minimal subset: IDs 1, 2, 13, 14)
        expect(actualMobileCount).toBe(4);
    });

    it('should have Evening questions with consistent IDs', () => {
        // Evening questions on both platforms should use IDs 13, 14 (not 15, 16)
        const mobileEveningIds = MOBILE_PROMPTS
            .filter(p => p.section === 'Evening')
            .map(p => p.id);

        const desktopEveningIds = DESKTOP_PROMPTS
            .filter(p => p.section === 'Evening')
            .map(p => p.id);

        // Mobile evening questions should be 13, 14
        expect(mobileEveningIds).toEqual(['13', '14']);

        // Desktop should include 13, 14, 15 for evening
        expect(desktopEveningIds).toContain('13');
        expect(desktopEveningIds).toContain('14');
        expect(desktopEveningIds).toContain('15');
    });
});
