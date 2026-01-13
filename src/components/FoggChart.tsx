import React from 'react';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Scatter,
    ReferenceArea
} from 'recharts';

interface FoggChartProps {
    motivation: number;
    ability: number;
}

const FoggChart: React.FC<FoggChartProps> = ({ motivation, ability }) => {
    // Generate the "Action Line" curve (Ability * Motivation = Threshold)
    // Let's assume a simplified curve where y = 100 / x or similar inverse relationship
    // In Fogg model: High Motivation allows Low Ability. High Ability allows Low Motivation.

    const curveData = [];
    for (let x = 1; x <= 10; x += 0.5) {
        // A simple reciprocal curve to represent the Action Line
        // If we map 1-10 scale.
        // Let's say Threshold constant is roughly 20 (on a 10x10 scale area context)
        // Motivation (y) = Threshold / Ability (x)
        // Shifted for visual balance
        const y = 8 / (x * 0.15) * 0.15;
        // Just drawing a visual curve that looks like Fogg's
        // Motivation = C / Ability is the standard form

        // Hardcoded visualization points for the "Action Line"
        // P1(1, 9), P2(9, 1) roughly
        let m = 0;
        if (x < 1) m = 10;
        else m = 5 / (x * 0.5);

        if (m > 10) m = 10;
        if (m < 0) m = 0;

        curveData.push({ ability: x, motivationLine: m });
    }

    // Current user point
    const userPoint = [
        { ability: ability, motivation: motivation, label: 'YOU' }
    ];

    const isAboveLine = (m: number, a: number) => {
        // Rough check against our curve function: m > 10/a
        return m * a > 15; // Improving the threshold logic for the "Success Zone"
    };

    const inSuccessZone = isAboveLine(motivation, ability);

    return (
        <div className="chart-container" style={{
            width: '100%',
            height: '300px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '16px',
            padding: '1rem',
            boxSizing: 'border-box',
            marginTop: '2rem'
        }}>
            <h3 style={{
                textAlign: 'center',
                color: '#cbd5e1',
                fontSize: '0.9rem',
                marginBottom: '10px'
            }}>
                B=MAP 分析模型
            </h3>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="ability"
                        type="number"
                        domain={[0, 10]}
                        tickCount={6}
                        label={{ value: '能力 (Ability) →', position: 'insideBottomRight', offset: -5, fill: '#94a3b8' }}
                        stroke="#64748b"
                    />
                    <YAxis
                        dataKey="motivation"
                        type="number"
                        domain={[0, 10]}
                        tickCount={6}
                        label={{ value: '动机 (Motivation) ↑', position: 'insideTopLeft', offset: 10, fill: '#94a3b8', angle: -90 }}
                        stroke="#64748b"
                    />
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                if (data.label === 'YOU') {
                                    return (
                                        <div style={{ background: '#1e293b', padding: '8px', borderRadius: '8px', border: '1px solid #475569' }}>
                                            <p style={{ color: '#fff', margin: 0 }}>你的位置</p>
                                            <p style={{ color: '#94a3b8', margin: 0 }}>能力: {data.ability}</p>
                                            <p style={{ color: '#94a3b8', margin: 0 }}>动机: {data.motivation}</p>
                                        </div>
                                    );
                                }
                            }
                            return null;
                        }}
                    />

                    {/* Action Curve Line */}
                    <Line
                        data={curveData}
                        type="monotone"
                        dataKey="motivationLine"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={false}
                        activeDot={false}
                        animationDuration={1000}
                    />

                    {/* User Position Point */}
                    <Scatter
                        data={userPoint}
                        fill={inSuccessZone ? '#4ade80' : '#ef4444'}
                        stroke="#fff"
                        strokeWidth={2}
                    >
                    </Scatter>
                </ComposedChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: '-20px', fontSize: '0.85rem' }}>
                <span style={{ color: inSuccessZone ? '#4ade80' : '#ef4444', fontWeight: 'bold' }}>
                    {inSuccessZone ? '✨ 成功区' : '⚠️ 触发区外'}
                </span>
            </div>
        </div>
    );
};

export default FoggChart;
