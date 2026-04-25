import { Handle, Position } from '@xyflow/react';

function CustomNode({ data }) {
  return (
    <div className="min-w-[200px] bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden font-sans">
      {/* Colored Header Strip */}

      <div className="p-4 flex items-start gap-3">
        {/* Icon/Emoji Container */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-xl border border-indigo-100">
          {data.emoji || '⚡'}
        </div>

        {/* Content */}
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-800 leading-tight">
            {data.AgentName.charAt(0).toUpperCase() + data.AgentName.slice(1) + ' Agent'}
          </span>
          <span className="text-xs text-gray-500 mt-1 font-medium bg-gray-100 px-2 py-0.5 rounded-full w-fit">
            {data.Description.substring(0, 20) + '...'}
          </span>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white transition-all hover:!bg-indigo-600 hover:!w-4 hover:!h-4"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white transition-all hover:!bg-indigo-600 hover:!w-4 hover:!h-4"
      />
    </div>
  );
}

export default CustomNode;
