import React from 'react';
import './Heatmap.css';
import { type HabitRecipe } from '../hooks/useHabits';

interface HeatmapProps {
    habits: HabitRecipe[];
}

const Heatmap: React.FC<HeatmapProps> = ({ habits }) => {
    // Generate last 365 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // We need a map of date string -> count
    const activityMap: Record<string, number> = {};

    habits.forEach(habit => {
        if (habit.history) {
            habit.history.forEach(timestamp => {
                const date = new Date(timestamp);
                const dateStr = date.toISOString().split('T')[0];
                activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
            });
        }
    });

    // Create array of weeks for last year? Or just last 3 months for mobile friendliness?
    // Let's do last 12 weeks (~3 months) to keep it compact and clean.
    const weeks = [];
    const WEEKS_TO_SHOW = 20;

    for (let i = 0; i < WEEKS_TO_SHOW; i++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
            const day = new Date(today);
            // Calculate backwards: 
            // Start from today, go back (WEEKS_TO_SHOW * 7) days + ...
            // Let's simplify: Show weeks ending today.
            const dayOffset = (WEEKS_TO_SHOW - 1 - i) * 7 + (6 - d);
            day.setDate(today.getDate() - dayOffset);

            const dateStr = day.toISOString().split('T')[0];
            const count = activityMap[dateStr] || 0;

            let level = 0;
            if (count > 0) level = 1;
            if (count > 2) level = 2;
            if (count > 4) level = 3;
            if (count > 6) level = 4;

            week.push({ date: dateStr, level, count });
        }
        weeks.push(week);
    }

    return (
        <div className="heatmap-container">
            <div className="heatmap-header">
                <h3>👑 行为热力图</h3>
                <span className="subtitle">Consistency is King</span>
            </div>
            <div className="heatmap-grid">
                {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="heatmap-week">
                        {week.map((day, dIdx) => (
                            <div
                                key={dIdx}
                                className={`heatmap-cell level-${day.level}`}
                                title={`${day.date}: ${day.count} habits`}
                            ></div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Heatmap;
