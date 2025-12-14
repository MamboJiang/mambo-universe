'use client';

import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { RefreshCcw, X, Info, Github, Globe } from 'lucide-react';
import { UniverseNode, transformTreeToGraph, GraphNode, getPathToNode, fetchUniverseData, JAPANESE_PALETTE } from '@/utils/data-transformer';

export default function UniverseGraph() {
    const fgRef = useRef<any>(null);

    // State
    const [data, setData] = useState<UniverseNode | null>(null); // Fetched Data
    const [lang, setLang] = useState<'en' | 'zh'>('zh'); // Language State
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
    const [viewRootId, setViewRootId] = useState<string | undefined>(undefined); // Drill-down root
    const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
    const [sidebarNode, setSidebarNode] = useState<GraphNode | null>(null); // For Sidebar
    const [showWelcome, setShowWelcome] = useState(true);

    // Initial Data Fetch & Language Switch
    useEffect(() => {
        setData(null); // Clear data while loading to show feedback if needed
        fetchUniverseData(`/data/${lang}/universe.json`)
            .then(setData)
            .catch(err => console.error("Failed to load universe:", err));
    }, [lang]);

    // Keep track of previous positions
    const nodesRef = useRef<{ [id: string]: any }>({});

    // Recompute graph data
    const graphData = useMemo(() => {
        if (!data) return { nodes: [], links: [] };

        // Pass optional rootId to filter tree
        const { nodes, links } = transformTreeToGraph(data, collapsedIds, viewRootId);

        // Position Reconciliation
        nodes.forEach((node: any) => {
            const prev = nodesRef.current[node.id];
            if (prev) {
                node.x = prev.x;
                node.y = prev.y;
                node.vx = prev.vx;
                node.vy = prev.vy;
            }
        });

        const newMap: { [id: string]: any } = {};
        nodes.forEach(n => newMap[n.id] = n);
        nodesRef.current = newMap;

        return { nodes, links };
    }, [data, collapsedIds, viewRootId]);

    // Calculate Breadcrumbs (Navigation)
    const breadcrumbs = useMemo(() => {
        if (!data || !viewRootId) return [];
        // Find path from global root to current viewRootId
        const path = getPathToNode(data, viewRootId);
        if (!path) return [];

        // Filter out root (MamboJiang) from breadcrumbs to avoid redundancy with title
        return path.filter(n => n.id !== data.id);
    }, [data, viewRootId]);

    // Interactions
    const handleNodeClick = useCallback((node: any) => {
        setSidebarNode(node);

        // Focus Camera
        if (fgRef.current) {
            fgRef.current.centerAt(node.x, node.y, 1000);
            fgRef.current.zoom(5, 2000);
        }
    }, []);

    const handleBackgroundClick = useCallback(() => {
        setSidebarNode(null); // Close sidebar on bg click
    }, []);

    const handleResetView = () => {
        if (fgRef.current) {
            fgRef.current.centerAt(0, 0, 1000);
            fgRef.current.zoom(5, 1000);
        }
    };

    const handleEnterNode = (nodeId: string) => {
        setViewRootId(nodeId);
        setSidebarNode(null);
        // Reset camera roughly to center
        if (fgRef.current) {
            fgRef.current.centerAt(0, 0, 1000);
            fgRef.current.zoom(5, 1000);
        }
    };

    const handleBreadcrumbClick = (nodeId: string | undefined) => {
        setViewRootId(nodeId); // undefined = Global Root
        if (fgRef.current) {
            // Slight delay to allow graph to re-render
            setTimeout(() => {
                fgRef.current.centerAt(0, 0, 1000);
                fgRef.current.zoom(5, 1000);
            }, 100);
        }
    };

    // --- Visual Configuration ---

    const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const isHover = node === hoverNode;

        // Font Size Calculation based on Level (User Request 1)
        // Level 0 (Root): 12
        // Level 1-2: 8
        // Level 3-4: 4
        // Level 5+: 2
        let baseSize = 12;
        if (node.level === 0) baseSize = 12;
        else if (node.level <= 2) baseSize = 8;
        else if (node.level <= 4) baseSize = 4;
        else baseSize = 2;

        const finalFontSize = baseSize * (isHover ? 1.5 : 1); // Hover zooms text more

        ctx.font = `${node.group === 0 ? 'bold' : ''} ${finalFontSize}px "Zen Old Mincho", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Palette Color
        let color = JAPANESE_PALETTE[node.group % 20] || '#E0E0E0';
        if (isHover) color = '#FFFFFF';

        ctx.fillStyle = color;
        ctx.fillText(node.id, node.x, node.y);

        // Underline if has children
        if (node.childCount > 0) {
            const width = ctx.measureText(node.id).width;
            ctx.beginPath();
            ctx.moveTo(node.x - width / 2, node.y + finalFontSize / 2 + 0.5);
            ctx.lineTo(node.x + width / 2, node.y + finalFontSize / 2 + 0.5);
            ctx.strokeStyle = color;
            ctx.lineWidth = 0.5 / globalScale;
            ctx.stroke();
        }
    }, [hoverNode]);

    // Hit Area Expansion
    const nodePointerAreaPaint = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
        // Recalculate size to match paintNode
        let baseSize = 12;
        if (node.level === 0) baseSize = 12;
        else if (node.level <= 2) baseSize = 8;
        else if (node.level <= 4) baseSize = 4;
        else baseSize = 2;

        const fontSize = baseSize;
        ctx.font = `${node.group === 0 ? 'bold' : ''} ${fontSize}px "Zen Old Mincho", serif`;
        const textWidth = ctx.measureText(node.id).width;
        const padding = 2; // Reduced padding for smaller nodes

        ctx.fillStyle = color;
        ctx.fillRect(
            node.x - textWidth / 2 - padding,
            node.y - fontSize / 2 - padding,
            textWidth + padding * 2,
            fontSize + padding * 2
        );
    }, []);

    const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const start = link.source;
        const end = link.target;
        if (typeof start !== 'object' || typeof end !== 'object') return;

        const isDashed = link.type === 'dashed';

        ctx.beginPath();

        if (isDashed) {
            const curvature = 0.2; // Increased curvature for visibility
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const mx = start.x + dx * 0.5;
            const my = start.y + dy * 0.5;
            const nx = -dy;
            const ny = dx;
            const cx = mx + nx * curvature;
            const cy = my + ny * curvature;

            ctx.moveTo(start.x, start.y);
            ctx.quadraticCurveTo(cx, cy, end.x, end.y);

            ctx.setLineDash([2, 5]);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 0.5 / globalScale;
            ctx.globalAlpha = 0.5;
            ctx.stroke();

            // Label
            if (link.label) {
                const curveMidX = 0.25 * start.x + 0.5 * cx + 0.25 * end.x;
                const curveMidY = 0.25 * start.y + 0.5 * cy + 0.25 * end.y;

                const fontSize = 3;
                ctx.font = `${fontSize}px "Zen Old Mincho", serif`;
                ctx.fillStyle = '#E0E0E0';
                ctx.globalAlpha = 0.8;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(link.label, curveMidX, curveMidY);
            }

            // Arrow Tip
            const arrowAngle = Math.atan2(end.y - cy, end.x - cx);
            const arrowLen = 3 / globalScale;

            // Re-adding the tangent arrow logic
            const nodeRadius = 6;
            const tipXReal = end.x - nodeRadius * Math.cos(arrowAngle);
            const tipYReal = end.y - nodeRadius * Math.sin(arrowAngle);

            ctx.beginPath(); // New path for arrow fill
            ctx.moveTo(tipXReal, tipYReal);
            ctx.lineTo(tipXReal - arrowLen * Math.cos(arrowAngle - Math.PI / 6), tipYReal - arrowLen * Math.sin(arrowAngle - Math.PI / 6));
            ctx.lineTo(tipXReal - arrowLen * Math.cos(arrowAngle + Math.PI / 6), tipYReal - arrowLen * Math.sin(arrowAngle + Math.PI / 6));
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.5;
            ctx.fill();

        } else {
            // SOLID
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.setLineDash([]);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1 / globalScale;
            ctx.globalAlpha = 0.3;
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
    }, []);

    // Physics
    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.d3Force('change', null);
            fgRef.current.d3Force('charge').strength(-100);

            // Tuned Link Force (User Request 2)
            // Dashed links have much weaker strength (0.05) to avoid pushing the tree layout apart
            fgRef.current.d3Force('link')
                .distance((link: any) => link.type === 'dashed' ? 20 : 20) // Dashed links slightly longer
                .strength((link: any) => link.type === 'dashed' ? 0.5 : 1); // Very weak strength for relations

            fgRef.current.d3ReheatSimulation();
        }
    }, [graphData]);

    if (!data) {
        return <div className="w-full h-full flex items-center justify-center text-white/50 animate-pulse font-serif">Loading Universe...</div>;
    }

    return (
        <div className="relative w-full h-full bg-[#050510] text-zinc-100 font-serif">
            <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                nodeLabel="id"
                nodeColor={() => '#FFF'}
                backgroundColor="#050510"

                nodeCanvasObject={paintNode}
                nodePointerAreaPaint={nodePointerAreaPaint} // Expanded Hit Area
                linkCanvasObject={paintLink}

                onNodeHover={setHoverNode}
                onNodeClick={handleNodeClick}
                onBackgroundClick={handleBackgroundClick}

                // Physics Tuning: Enable Visible Settling (User Request 1)
                d3VelocityDecay={0.3}
                warmupTicks={0} // NO Warmup -> Visible movement from start
                cooldownTicks={1000} // Longer settle time (User Request 1)
            />

            {/* Welcome Popup (User Request 1 & 2) */}
            {showWelcome && (
                <div className="absolute top-24 left-8 max-w-sm bg-[#0A0A15]/95 border border-white/20 p-6 rounded-sm shadow-2xl z-50 backdrop-blur-md">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-light text-[#FFE082]">
                            {lang === 'en' ? "Welcome to MamboJiang's Universe" : "欢迎来到 MamboJiang 的宇宙"}
                        </h3>
                        <button onClick={() => setShowWelcome(false)} className="text-white/50 hover:text-white"><X size={16} /></button>
                    </div>
                    <ul className="text-sm text-white/70 space-y-2 list-disc list-inside font-sans tracking-wide">
                        {lang === 'en' ? (
                            <>
                                <li><strong>Navigate:</strong> Use the top-left breadcrumbs to switch levels.</li>
                                <li><strong>Explore:</strong> Click elements to view details.</li>
                                <li><strong>Deep Dive:</strong> Underlined text indicates a sub-universe you can enter.</li>
                            </>
                        ) : (
                            <>
                                <li><strong>导航：</strong> 使用左上角的路径切换层级。</li>
                                <li><strong>探索：</strong> 点击节点查看详细介绍。</li>
                                <li><strong>进入：</strong> 带有下划线的节点表示可进入的子宇宙。</li>
                            </>
                        )}
                    </ul>
                </div>
            )}

            {/* Navigation Overlay (Breadcrumbs) (User Request 1: Cleaner) */}
            <div className="absolute top-8 left-8 flex flex-col items-start gap-2 select-none z-30">
                <div
                    className="group cursor-pointer flex items-center gap-2"
                    onClick={() => handleBreadcrumbClick(undefined)} // Reset to Global
                >
                    {/* Title acts as root breadcrumb basically */}
                    <h1 className={`text-3xl font-light tracking-[0.2em] transition duration-300 ${!viewRootId ? 'text-white border-b border-white' : 'opacity-80 group-hover:opacity-100'}`} style={{ fontFamily: '"Zen Old Mincho", serif' }}>
                        {data.id.toUpperCase()}
                    </h1>
                </div>

                {/* Breadcrumb Path */}
                {viewRootId && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/40 tracking-widest pl-1 mt-1 font-sans">
                        {breadcrumbs.map((crumb, index) => {
                            const isLast = index === breadcrumbs.length - 1;
                            return (
                                <div key={crumb.id} className="flex items-center gap-2">
                                    {index === 0 && <span>/</span>}
                                    {index > 0 && <span>/</span>}
                                    <span
                                        className={`cursor-pointer border-b border-transparent transition ${isLast ? 'text-white border-white scale-105' : 'hover:text-white/80 hover:border-white/50'}`}
                                        onClick={() => handleBreadcrumbClick(crumb.id)}
                                    >
                                        {crumb.id}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bottom Left Controls (User Request 2 & 3) */}
            <div className="absolute bottom-8 left-8 flex items-center gap-4 z-30">
                {/* Language Toggle */}
                <button
                    onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
                    className="flex items-center gap-2 text-xs tracking-widest text-white/50 hover:text-white transition group"
                >
                    <Globe size={14} className="group-hover:rotate-180 transition duration-500" />
                    <span>{lang === 'en' ? '中文' : 'ENGLISH'}</span>
                </button>

                <div className="h-3 w-[1px] bg-white/20"></div>

                {/* Github Link */}
                <a
                    href="https://github.com/mambojiang"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/50 hover:text-white transition"
                >
                    <Github size={16} />
                </a>
            </div>

            {/* Reset Button (User Request 6: Fix Z-Index) */}
            <div className="absolute bottom-10 right-10 flex flex-col gap-2 z-30">
                {/* Lower z-index than Sidebar (z-40) */}
                <button onClick={handleResetView} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition backdrop-blur-sm border border-white/5" title="Reset View">
                    <RefreshCcw size={20} />
                </button>
            </div>

            {/* Sidebar (User Request 3) */}
            <div className={`absolute top-0 right-0 h-full w-80 bg-[#0A0A15]/90 backdrop-blur-md border-l border-white/10 p-8 transform transition-transform duration-300 ease-in-out z-40 ${sidebarNode ? 'translate-x-0' : 'translate-x-full'}`}>
                {sidebarNode && (
                    <div className="flex flex-col h-full relative">
                        {/* Close Button (User Request 2) */}
                        <button
                            onClick={() => setSidebarNode(null)}
                            className="absolute top-0 right-0 p-2 text-white/30 hover:text-white transition"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-light mb-4 text-[#FFE082] mt-4">{sidebarNode.id}</h2>
                        <div className="text-sm text-white/60 leading-loose mb-8 flex-grow font-sans">
                            {sidebarNode.description ? sidebarNode.description : (lang === 'en' ? "No description available." : "暂无描述。")}
                        </div>

                        {/* Enter Button Logic: Hide if current Root (Check viewRootId OR global root 'MamboJiang') */}
                        {sidebarNode.childCount > 0 && sidebarNode.id !== (viewRootId || data.id) && (
                            <button
                                onClick={() => handleEnterNode(sidebarNode.id)}
                                className="mt-auto py-3 px-6 border border-white/20 hover:bg-white/5 text-white/80 hover:text-white transition rounded-sm uppercase tracking-widest text-xs"
                            >
                                {lang === 'en' ? 'Enter Universe' : '进入层级'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
