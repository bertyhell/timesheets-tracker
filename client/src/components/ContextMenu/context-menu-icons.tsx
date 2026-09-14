import {
  Copy,
  Download,
  Pencil,
  RefreshCw,
  Sprout,
  Tag,
  Tags,
  Timer,
  Trash2,
  Wand2,
} from 'lucide-react';

const ICON_SIZE = 14;

// Shared so the same action always looks the same in every context menu
export const contextMenuIcons = {
  edit: <Pencil size={ICON_SIZE} color="#2563eb" />,
  editRule: <Wand2 size={ICON_SIZE} color="#2563eb" />,
  delete: <Trash2 size={ICON_SIZE} color="#dc2626" />,
  createTag: <Tag size={ICON_SIZE} color="#16a34a" />,
  bulkTag: <Tags size={ICON_SIZE} color="#16a34a" />,
  createAutoTagRule: <Wand2 size={ICON_SIZE} color="#9333ea" />,
  growAutoTags: <Sprout size={ICON_SIZE} color="#059669" />,
  export: <Download size={ICON_SIZE} color="#9333ea" />,
  refresh: <RefreshCw size={ICON_SIZE} color="#ea580c" />,
  copy: <Copy size={ICON_SIZE} color="#d97706" />,
  duration: <Timer size={ICON_SIZE} color="#d97706" />,
};
