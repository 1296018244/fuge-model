import React, { useMemo } from 'react';
import { Anchor, Link2, CheckCircle, Circle, Star, TrendingUp } from 'lucide-react';
import './HabitClusterView.css';

interface Habit {
    id: string;
    anchor: string;
    tiny_behavior: string;
    completed_count?: number;
    current_streak?: number;
    next_habit_id?: string;
}

interface HabitClusterViewProps {
    habits: Habit[];
    onHabitClick?: (habitId: string) => void;
}

interface Cluster {
    anchor: string;
    normalizedAnchor: string;
    habits: Habit[];
    totalCompletions: number;
    chainedCount: number;
}

// 标准化锚点（去除细节差异）
const normalizeAnchor = (anchor: string): string => {
    return anchor
        .replace(/当|在|每|后|时|完/g, '')
        .replace(/我|自己/g, '')
        .trim()
        .toLowerCase();
};

// 计算群落健康度 (0-100)
const calculateClusterHealth = (cluster: Cluster): number => {
    const habitsScore = Math.min(cluster.habits.length * 20, 40); // 最多40分
    const completionScore = Math.min(cluster.totalCompletions * 2, 30); // 最多30分
    const chainScore = cluster.chainedCount > 0 ? 30 : 0; // 有链比没链好
    return habitsScore + completionScore + chainScore;
};

const HabitClusterView: React.FC<HabitClusterViewProps> = ({ habits, onHabitClick }) => {
    // 按锚点分组
    const clusters = useMemo(() => {
        const clusterMap = new Map<string, Habit[]>();

        habits.forEach(habit => {
            const normalized = normalizeAnchor(habit.anchor);
            if (!clusterMap.has(normalized)) {
                clusterMap.set(normalized, []);
            }
            clusterMap.get(normalized)!.push(habit);
        });

        const result: Cluster[] = [];
        clusterMap.forEach((habitList, normalizedAnchor) => {
            // 使用第一个习惯的完整锚点作为显示
            const displayAnchor = habitList[0].anchor;
            const totalCompletions = habitList.reduce((sum, h) => sum + (h.completed_count || 0), 0);
            const chainedCount = habitList.filter(h => h.next_habit_id).length;

            result.push({
                anchor: displayAnchor,
                normalizedAnchor,
                habits: habitList,
                totalCompletions,
                chainedCount,
            });
        });

        // 按习惯数量降序排列
        return result.sort((a, b) => b.habits.length - a.habits.length);
    }, [habits]);

    if (clusters.length === 0) {
        return (
            <div className="cluster-empty">
                <p>还没有习惯，添加一个开始吧！</p>
            </div>
        );
    }

    return (
        <div className="habit-cluster-view">
            <div className="cluster-header">
                <h3>🌱 习惯群落</h3>
                <p>围绕同一锚点的习惯会形成强大的群落</p>
            </div>

            <div className="clusters-container">
                {clusters.map(cluster => {
                    const health = calculateClusterHealth(cluster);
                    const healthColor = health >= 70 ? '#10b981' : health >= 40 ? '#f59e0b' : '#64748b';

                    return (
                        <div key={cluster.normalizedAnchor} className="cluster-card">
                            {/* 锚点头部 */}
                            <div className="cluster-anchor">
                                <Anchor size={18} />
                                <span className="anchor-text">{cluster.anchor}</span>
                                <span
                                    className="health-badge"
                                    style={{ backgroundColor: healthColor }}
                                    title="群落健康度"
                                >
                                    {health}%
                                </span>
                            </div>

                            {/* 习惯列表 */}
                            <div className="cluster-habits">
                                {cluster.habits.map((habit) => (
                                    <div
                                        key={habit.id}
                                        className="cluster-habit"
                                        onClick={() => onHabitClick?.(habit.id)}
                                    >
                                        <div className="habit-indicator">
                                            {habit.completed_count && habit.completed_count > 0
                                                ? <CheckCircle size={14} color="#10b981" />
                                                : <Circle size={14} color="#64748b" />
                                            }
                                        </div>
                                        <span className="habit-name">{habit.tiny_behavior}</span>
                                        {habit.next_habit_id && (
                                            <Link2 size={14} className="chain-icon" />
                                        )}
                                        {habit.current_streak && habit.current_streak >= 7 && (
                                            <Star size={14} className="streak-icon" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* 群落统计 */}
                            <div className="cluster-stats">
                                <span className="stat">
                                    <TrendingUp size={14} />
                                    {cluster.totalCompletions} 次完成
                                </span>
                                {cluster.chainedCount > 0 && (
                                    <span className="stat chained">
                                        <Link2 size={14} />
                                        {cluster.chainedCount} 个已链接
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 提示 */}
            <div className="cluster-tip">
                💡 Tip: 围绕同一锚点添加多个习惯，可以形成强大的习惯群落！
            </div>
        </div>
    );
};

export default HabitClusterView;
