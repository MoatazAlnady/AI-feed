import AdminPendingToolsEnhanced from './AdminPendingToolsEnhanced';

interface AdminPendingToolsProps {
  onRefresh?: () => void;
}

const AdminPendingTools: React.FC<AdminPendingToolsProps> = ({ onRefresh }) => {
  return <AdminPendingToolsEnhanced onRefresh={onRefresh} />;
};

export default AdminPendingTools;