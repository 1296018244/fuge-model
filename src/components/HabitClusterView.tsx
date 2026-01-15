import React, { useMemo } from 'react';
import { Anchor, CheckCircle, ChevronDown, ChevronRight, Zap, Check, Plus, Circle, TrendingUp, Link2, Star, ChevronUp } from 'lucide-react';
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
    onBatchCheckIn?: (habitIds: string[]) => void;
    onAdd?: (anchor: string) => void;
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

const HabitClusterView: React.FC<HabitClusterViewProps> = ({ habits, onHabitClick, onBatchCheckIn, onAdd, onReorder }) => {
    // 按链式锚点分组
    const clusters = useMemo(() => {
        const clusterMap = new Map<string, Habit[]>();
        const habitMap = new Map<string, Habit>();
        const parentMap = new Map<string, string>(); // childId -> parentId

        // 1. 构建映射关系
        habits.forEach(h => {
            habitMap.set(h.id, h);
            if (h.next_habit_id) {
                parentMap.set(h.next_habit_id, h.id);
            }
        });

        // 2. 找到每个习惯的"根锚点"
        const getRootAnchor = (habitId: string): string => {
            let curr = habitId;
            const visited = new Set<string>();
            while (parentMap.has(curr)) {
                if (visited.has(curr)) break;
                visited.add(curr);
                curr = parentMap.get(curr)!;
            }
            return habitMap.get(curr)?.anchor ? normalizeAnchor(habitMap.get(curr)!.anchor) : 'uncategorized';
        };

        // 3. 分组
        habits.forEach(h => {
            const key = getRootAnchor(h.id);
            if (!clusterMap.has(key)) clusterMap.set(key, []);
            clusterMap.get(key)!.push(h);
        });

        const result: Cluster[] = [];
        clusterMap.forEach((habitList, normalizedAnchorKey) => {
            // 4. 组内排序：链头 -> 链身 (递归排序)
            // 找到当前组的链头（没有父级在这个组里的）
            // 这里的 normalizedAnchorKey 是链头的 normalized anchor.
            // 我们需要按链的顺序排列列表

            // 构建组内父子关系
            const localKidsMap = new Map<string, string>(); // parent -> child
            // 实际上我们要用 habits 构建这一层链表
            // 但注意：next_habit_id 是 1对1 还是 1对多？接口上是 next_habit_id string，所以是单链。

            // 找到组内的 Root (ParentMap 中没有它的记录，或者 Parent不在这个组里)
            // 实际上按照上面的 getRootAnchor 逻辑，组里一定有一个（或多个，如果它们共享同一个 anchor 文本）Root。

            // 但如果有两组完全独立的链，它们的 Root 恰好 Anchor 相同（比如都叫“早上”），它们会混在这个 list 里。
            // 对于混合的情况，我们尽量把有关系的放一起。

            const sortedList: Habit[] = [];
            const visited = new Set<string>();

            // 辅助：获取习惯的"链深度"
            // const getDepth = (id: string): number => {
            //     let d = 0;
            //     let curr = id;
            //     while (parentMap.has(curr)) {
            //         d++;
            //         curr = parentMap.get(curr)!;
            //     }
            //     return d;
            // };

            // 先把 list 按深度排序，Root (depth 0) 在前
            // const sortedByDepth = [...habitList].sort((a, b) => getDepth(a.id) - getDepth(b.id));

            // 更精细的排序：DFS 遍历
            // 构建邻接表
            const forwardMap = new Map<string, string>();
            habitList.forEach(h => {
                if (h.next_habit_id) forwardMap.set(h.id, h.next_habit_id);
            });

            // 找到所有在这个组内的"局部根" (Incoming edge count = 0 within this group)
            const incomingCount = new Map<string, number>();
            habitList.forEach(h => {
                if (!incomingCount.has(h.id)) incomingCount.set(h.id, 0);
                if (h.next_habit_id && habitList.some(child => child.id === h.next_habit_id)) {
                    const childId = h.next_habit_id;
                    incomingCount.set(childId, (incomingCount.get(childId) || 0) + 1);
                }
            });

            const localRoots = habitList.filter(h => (incomingCount.get(h.id) || 0) === 0);

            // 按原来的逻辑（可能是创建时间？）对 Roots 排序，保持稳定性
            // 这里简单按 ID 或 Anchor 字母序，或者保持原数组顺序
            // SORT ROOTS BY sort_order
            localRoots.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

            const process = (root: Habit) => {
                if (visited.has(root.id)) return;
                visited.add(root.id);
                sortedList.push(root);
                if (forwardMap.has(root.id)) {
                    const next = habitList.find(h => h.id === forwardMap.get(root.id));
                    if (next) process(next);
                }
            };
            localRoots.forEach(r => process(r));
            habitList.forEach(h => { if (!visited.has(h.id)) sortedList.push(h); }); // leftovers

            // 寻找显示用的 Anchor Text (取第一个 Root 的 anchor)
            const displayAnchor = localRoots.length > 0 ? localRoots[0].anchor : habitList[0].anchor;

            const totalCompletions = habitList.reduce((s, h) => s + (h.completed_count || 0), 0);
            const chainedCount = habitList.filter(h => h.next_habit_id).length;

            result.push({
                anchor: displayAnchor, // 使用链头的锚点
                normalizedAnchor: normalizedAnchorKey,
                habits: sortedList, // 使用排序后的列表
                totalCompletions,
                chainedCount,
            });
        });

        // 按习惯数量降序排列
        return result.sort((a, b) => b.habits.length - a.habits.length);
    }, [habits]);

    const handleMove = (cluster: Cluster, habitId: string, direction: 'up' | 'down') => {
        if (!onReorder) return;

        // Find roots in this cluster to swap
        // We only reorder ROOTS.
        // Reconstruct roots list.
        const habitList = cluster.habits;
        // Identify roots: habits not chained to previous
        // Actually, cluster.habits IS sorted as [Root1, Child1, Child2, Root2, Child3...]
        // We can extract the Roots from this list.

        const roots: Habit[] = [];
        habitList.forEach((h, i) => {
            const isChild = i > 0 && habitList[i - 1].next_habit_id === h.id;
            if (!isChild) roots.push(h);
        });

        const rootIndex = roots.findIndex(r => r.id === habitId);
        if (rootIndex === -1) return; // Should not happen if we only show arrow on roots

        const newRoots = [...roots];
        if (direction === 'up') {
            if (rootIndex === 0) return;
            [newRoots[rootIndex - 1], newRoots[rootIndex]] = [newRoots[rootIndex], newRoots[rootIndex - 1]];
        } else {
            if (rootIndex === newRoots.length - 1) return;
            [newRoots[rootIndex], newRoots[rootIndex + 1]] = [newRoots[rootIndex + 1], newRoots[rootIndex]];
        }

        // Submit NEW ORDER of IDs (Roots only is enough for our backend logic)
        onReorder(newRoots.map(r => r.id));
    };

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
                <h3>🌱 习惯群落 {onReorder && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>(支持排序)</span>}</h3>
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
                                {onBatchCheckIn && (
                                    <button
                                        className="batch-check-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onBatchCheckIn(cluster.habits.map(h => h.id));
                                        }}
                                        title="全部打卡"
                                        style={{ marginLeft: 'auto', background: '#ecfdf5', color: '#10b981', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                                    >
                                        <CheckCircle size={14} /> 全部
                                    </button>
                                )}
                                {onAdd && (
                                    <button
                                        className="batch-add-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAdd(cluster.anchor);
                                        }}
                                        title="添加到此群落"
                                        style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            padding: '4px 8px',
                                            color: '#94a3b8',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '0.8rem',
                                            marginLeft: '8px'
                                        }}
                                    >
                                        <Plus size={14} /> 添加
                                    </button>
                                )}
                            </div>

                            {/* 习惯列表 */}
                            <div className="cluster-habits">
                                {cluster.habits.map((habit, index) => {
                                    // Check if this habit is the "next step" of the previous one in the list
                                    const isChainedToPrev = index > 0 && cluster.habits[index - 1].next_habit_id === habit.id;

                                    return (
                                        <div
                                            key={habit.id}
                                            className="cluster-habit"
                                            style={{
                                                marginLeft: isChainedToPrev ? '24px' : '0px',
                                                borderLeft: isChainedToPrev ? '2px solid #e2e8f0' : 'none',
                                                paddingLeft: isChainedToPrev ? '12px' : '16px',
                                                position: 'relative'
                                            }}
                                            onClick={() => onHabitClick?.(habit.id)}
                                        >
                                            {isChainedToPrev && (
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '-2px',
                                                    top: '-16px', // Connect from above
                                                    bottom: '50%',
                                                    width: '2px',
                                                    background: '#e2e8f0'
                                                }} />
                                            )}
                                            {isChainedToPrev && (
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '-2px',
                                                    top: '50%',
                                                    width: '12px',
                                                    height: '2px',
                                                    background: '#e2e8f0',
                                                }} />
                                            )}

                                            <div className="habit-indicator">
                                                {habit.completed_count && habit.completed_count > 0
                                                    ? <CheckCircle size={14} color="#10b981" />
                                                    : <Circle size={14} color="#64748b" />
                                                }
                                            </div>
                                            <div className="habit-content" style={{ flex: 1 }}>
                                                <span className="habit-name">{habit.tiny_behavior}</span>
                                                {/* Show small anchor text if it differs from group (e.g. "After X") */}
                                                {isChainedToPrev && (
                                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>
                                                        (接上一步)
                                                    </span>
                                                )}
                                            </div>

                                            {/* Reorder Buttons (Only for non-chained roots) */}
                                            {!isChainedToPrev && onReorder && (
                                                <div className="reorder-controls" style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '8px' }}>
                                                    <div onClick={(e) => { e.stopPropagation(); handleMove(cluster, habit.id, 'up'); }} style={{ cursor: 'pointer', padding: '2px', opacity: 0.5, ':hover': { opacity: 1 } }}>
                                                        <ChevronUp size={12} color="#94a3b8" />
                                                    </div>
                                                    <div onClick={(e) => { e.stopPropagation(); handleMove(cluster, habit.id, 'down'); }} style={{ cursor: 'pointer', padding: '2px', opacity: 0.5 }}>
                                                        <ChevronDown size={12} color="#94a3b8" />
                                                    </div>
                                                </div>
                                            )}

                                            {habit.next_habit_id && (
                                                <Link2 size={14} className="chain-icon" style={{ opacity: 0.3 }} />
                                            )}
                                            {habit.current_streak && habit.current_streak >= 7 && (
                                                <Star size={14} className="streak-icon" />
                                            )}
                                        </div>
                                    );
                                })}
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
                💡 Tip: 使用右侧箭头调整习惯顺序，打造完美流程。
            </div>
        </div>
    );
};

export default HabitClusterView;
