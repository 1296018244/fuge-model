import React from 'react';
import { Share2, ArrowRight } from 'lucide-react';

interface RecipeCardProps {
    recipe: {
        anchor: string;
        tiny_behavior: string;
    };
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
    if (!recipe || !recipe.anchor) return null;

    return (
        <div className="recipe-card" style={{
            marginTop: '2rem',
            background: 'linear-gradient(135deg, #fff 0%, #f3f4f6 100%)',
            borderRadius: '20px',
            padding: '0',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            position: 'relative',
            border: '4px solid white'
        }}>
            <div style={{
                background: '#4a90e2',
                padding: '0.8rem',
                textAlign: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1rem',
                letterSpacing: '1px'
            }}>
                微习惯配方 (Tiny Habit Recipe)
            </div>

            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '0.5rem 1rem',
                        borderRadius: '50px',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap'
                    }}>
                        当...
                    </div>
                    <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#334155', flex: 1 }}>
                        {recipe.anchor}
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ArrowRight size={24} color="#94a3b8" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: '0.5rem 1rem',
                        borderRadius: '50px',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap'
                    }}>
                        我就...
                    </div>
                    <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#334155', flex: 1 }}>
                        {recipe.tiny_behavior}
                    </p>
                </div>
            </div>

            <div style={{
                padding: '1rem',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
            }}>
                <Share2 size={16} color="#64748b" />
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>分享配方</span>
            </div>
        </div>
    );
};

export default RecipeCard;
