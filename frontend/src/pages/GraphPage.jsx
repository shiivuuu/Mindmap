import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Network,
  Search,
  Filter,
  Plus,
  RotateCcw,
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';
import { graphApi } from '../api/graph';
import { useWorkspace } from '../context/WorkspaceContext';
import CustomConceptNode from '../components/graph/CustomConceptNode';
import GraphDrawer from '../components/graph/GraphDrawer';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

const nodeTypes = {
  concept: CustomConceptNode,
};

export default function GraphPage() {
  const { currentWorkspace } = useWorkspace();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);

  useEffect(() => {
    if (currentWorkspace) {
      loadGraph();
    }
  }, [currentWorkspace]);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const data = await graphApi.getGraph(currentWorkspace.id);
      setCategories(data.categories || []);

      // Calculate layout coordinates for nodes in concentric or clustered grid
      const rawNodes = data.nodes || [];
      const rawEdges = data.edges || [];

      const nodeLookup = {};
      rawNodes.forEach((n) => {
        nodeLookup[n.id] = n;
      });

      // Simple radial/grid placement algorithm for readable layout
      const flowNodes = rawNodes.map((n, idx) => {
        const angle = (idx / rawNodes.length) * 2 * Math.PI;
        const radius = 280 + (idx % 2 === 0 ? 0 : 80);
        const x = Math.round(400 + radius * Math.cos(angle));
        const y = Math.round(300 + radius * Math.sin(angle));

        return {
          id: n.id,
          type: 'concept',
          position: { x, y },
          data: {
            id: n.id,
            name: n.name,
            category: n.category,
            difficulty: n.difficulty_level,
            masteryScore: n.mastery_score,
            status: n.mastery_status,
            summary: n.summary,
            aliases: n.aliases,
          },
        };
      });

      const flowEdges = rawEdges.map((e) => {
        const srcNode = nodeLookup[e.source_id];
        const tgtNode = nodeLookup[e.target_id];

        // Edge styling by relation type
        const isPrereq = e.relation_type === 'prerequisite_of';
        return {
          id: e.id,
          source: e.source_id,
          target: e.target_id,
          animated: isPrereq,
          label: e.relation_type.replace(/_/g, ' '),
          style: {
            stroke: isPrereq ? '#8B5CF6' : '#06B6D4',
            strokeWidth: 2,
          },
          labelStyle: { fill: '#94A3B8', fontSize: 10, fontWeight: 600 },
          labelBgStyle: { fill: '#0B0F19', fillOpacity: 0.8 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isPrereq ? '#8B5CF6' : '#06B6D4',
          },
          data: {
            id: e.id,
            relation_type: e.relation_type,
            confidence: e.confidence,
            rationale: e.rationale,
            evidence_quote: e.evidence_quote,
            source_name: srcNode ? srcNode.name : 'Source',
            target_name: tgtNode ? tgtNode.name : 'Target',
          },
        };
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (err) {
      console.error('Failed to load graph:', err);
    } finally {
      setLoading(false);
    }
  };

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.map((node) => {
      const matchCat = selectedCategory === 'all' || node.data.category === selectedCategory;
      const matchSearch = !searchQuery || node.data.name.toLowerCase().includes(searchQuery.toLowerCase());
      const isVisible = matchCat && matchSearch;
      return {
        ...node,
        style: {
          opacity: isVisible ? 1 : 0.15,
          pointerEvents: isVisible ? 'all' : 'none',
        },
      };
    });
  }, [nodes, selectedCategory, searchQuery]);

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl overflow-hidden relative">
      {/* Top Filter and Controls Toolbar */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
            <Network className="w-4 h-4 text-violet-400" />
            <span>Interactive Knowledge Graph</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-800 text-slate-400">
            <span>{nodes.length} Concepts</span>
            <span>•</span>
            <span>{edges.length} Evidence Edges</span>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="all">All Domains</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button
            onClick={loadGraph}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Reload graph"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 w-full h-full relative bg-[#0B0F19]">
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton count={3} className="h-32" />
          </div>
        ) : (
          <ReactFlow
            nodes={filteredNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#1E293B" gap={20} size={1} />
            <Controls className="!border-slate-800 !bg-slate-900 !rounded-2xl overflow-hidden shadow-2xl" />
            <MiniMap
              nodeColor={(n) => (n.data?.status === 'mastered' ? '#10B981' : '#8B5CF6')}
              maskColor="rgba(11, 15, 25, 0.8)"
              className="!border-slate-800 !bg-slate-950 !rounded-2xl overflow-hidden"
            />
          </ReactFlow>
        )}

        {/* Slide-out Concept & Edge Inspector */}
        <GraphDrawer
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onClose={() => {
            setSelectedNode(null);
            setSelectedEdge(null);
          }}
        />
      </div>
    </div>
  );
}
