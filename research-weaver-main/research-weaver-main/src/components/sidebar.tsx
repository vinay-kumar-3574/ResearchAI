import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  loadSessions,
  loadFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  moveSessionToFolder,
  deleteSession,
  type ResearchSession,
  type Folder,
} from "@/lib/research-store";
import {
  Plus,
  Folder as FolderIcon,
  MoreHorizontal,
  MessageSquare,
  Edit2,
  Trash,
  Settings,
  LogOut,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  
  // Modals state
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");

  const loadData = async () => {
    if (!user) return;
    try {
      const [sessData, folderData] = await Promise.all([
        loadSessions(user.id),
        loadFolders(user.id),
      ]);
      setSessions(sessData);
      setFolders(folderData);
    } catch (err) {
      console.error("Failed to load sidebar data:", err);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData();
    window.addEventListener("refresh-sidebar", handleRefresh);
    return () => window.removeEventListener("refresh-sidebar", handleRefresh);
  }, [user]);

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !user) return;
    try {
      await createFolder(user.id, newFolderName.trim());
      setNewFolderName("");
      setIsCreatingFolder(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameFolder = async (folderId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editFolderName.trim()) return;
    try {
      await renameFolder(folderId, editFolderName.trim());
      setEditingFolderId(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Are you sure you want to delete this folder? Its sessions will be moved to Recents.")) return;
    try {
      await deleteFolder(folderId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    try {
      await deleteSession(sessionId);
      loadData();
      window.dispatchEvent(new Event("refresh-sidebar")); // trigger sync
      if (location.pathname === `/research/${sessionId}`) {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveSession = async (sessionId: string, folderId: string | null) => {
    try {
      await moveSessionToFolder(sessionId, folderId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const activeId = location.pathname.split("/")[2];

  return (
    <div className="w-[260px] flex-shrink-0 h-screen bg-[#F9F9F8] dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 flex flex-col border-r border-gray-200 dark:border-gray-800">
      {/* Top Header */}
      <div className="px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-lg">
          <span className="inline-flex size-6 items-center justify-center rounded bg-brand text-[10px] font-bold text-white font-mono">R</span>
          ResearchAI
        </Link>
      </div>

      <div className="px-3 pb-3">
        <Link
          to="/dashboard"
          className="w-full flex items-center gap-2 bg-white dark:bg-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#3a3a3a] text-gray-800 dark:text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <Plus className="size-4 text-brand" />
          New Research
        </Link>
      </div>

      {/* Main Nav Links removed */}

      {/* Folders and History */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5 custom-scrollbar">
        
        {/* Folders Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5 group">
            <h3 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Folders</h3>
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          
          {isCreatingFolder && (
            <form onSubmit={handleCreateFolder} className="px-2 mb-2 flex items-center gap-2">
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onBlur={() => setIsCreatingFolder(false)}
                className="bg-white dark:bg-gray-800 text-sm rounded-md px-2 py-1.5 w-full border border-brand/40 outline-none ring-2 ring-brand/10 shadow-sm"
                placeholder="Folder name..."
              />
            </form>
          )}

          <div className="flex flex-col gap-0.5">
            {folders.map((folder) => {
              const folderSessions = sessions.filter((s) => s.folder_id === folder.id);
              const isOpen = openFolders[folder.id];

              return (
                <div key={folder.id} className="flex flex-col">
                  {editingFolderId === folder.id ? (
                    <form onSubmit={(e) => handleRenameFolder(folder.id, e)} className="px-2 py-1">
                      <input
                        autoFocus
                        value={editFolderName}
                        onChange={(e) => setEditFolderName(e.target.value)}
                        onBlur={() => setEditingFolderId(null)}
                        className="bg-white dark:bg-gray-800 text-sm rounded-md px-2 py-1.5 w-full border border-brand/40 outline-none ring-2 ring-brand/10 shadow-sm"
                      />
                    </form>
                  ) : (
                    <div className="group flex items-center justify-between hover:bg-gray-200/40 dark:hover:bg-gray-800/50 rounded-lg px-2 py-1.5 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => toggleFolder(folder.id)}>
                        {isOpen ? <ChevronDown className="size-3.5 text-gray-400" /> : <ChevronRight className="size-3.5 text-gray-400" />}
                        <FolderOpen className="size-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm truncate select-none font-medium">{folder.name}</span>
                      </div>
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-opacity">
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content align="end" className="z-50 min-w-[160px] bg-white dark:bg-[#2a2a2a] rounded-lg p-1.5 shadow-xl border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 animate-in fade-in-0 zoom-in-95">
                            <DropdownMenu.Item
                              onClick={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name); }}
                              className="flex items-center gap-2 px-2 py-1.5 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                            >
                              <Edit2 className="size-3.5" /> Rename
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={() => handleDeleteFolder(folder.id)}
                              className="flex items-center gap-2 px-2 py-1.5 text-sm outline-none hover:bg-destructive hover:text-destructive-foreground rounded-md cursor-pointer text-destructive"
                            >
                              <Trash className="size-3.5" /> Delete
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                  )}

                  {isOpen && (
                    <div className="pl-6 flex flex-col gap-0.5 mt-0.5 border-l border-gray-200 dark:border-gray-800 ml-3.5">
                      {folderSessions.map((s) => (
                        <SessionItem 
                          key={s.id} 
                          session={s} 
                          active={activeId === s.id} 
                          folders={folders}
                          onDelete={() => handleDeleteSession(s.id)}
                          onMove={(fId) => handleMoveSession(s.id, fId)}
                        />
                      ))}
                      {folderSessions.length === 0 && (
                        <div className="px-2 py-1.5 text-[11px] text-gray-400 dark:text-gray-600 font-medium">Empty</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recents Section */}
        <div>
          <h3 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2 mb-1.5">Recents</h3>
          <div className="flex flex-col gap-0.5">
            {sessions
              .filter((s) => !s.folder_id)
              .map((s) => (
                <SessionItem 
                  key={s.id} 
                  session={s} 
                  active={activeId === s.id} 
                  folders={folders}
                  onDelete={() => handleDeleteSession(s.id)}
                  onMove={(fId) => handleMoveSession(s.id, fId)}
                />
              ))}
          </div>
        </div>

      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="w-full flex items-center gap-3 hover:bg-gray-200/50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors text-left outline-none">
              <div className="size-8 rounded-full bg-brand-dark text-white flex items-center justify-center text-xs font-semibold font-mono shadow-sm">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user?.name ?? "Guest"}</div>
                <div className="text-[10px] text-gray-500 font-mono uppercase">Researcher</div>
              </div>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" side="top" sideOffset={8} className="z-50 min-w-[220px] bg-white dark:bg-[#2a2a2a] rounded-lg p-1.5 shadow-xl border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 animate-in fade-in-0 slide-in-from-bottom-2">
              <DropdownMenu.Item asChild>
                <Link to="/settings" className="flex items-center gap-2 px-2 py-1.5 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer">
                  <Settings className="size-4 opacity-70" /> Settings
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-gray-100 dark:bg-gray-700 my-1.5 mx-1" />
              <DropdownMenu.Item 
                onClick={() => { logout(); navigate("/login"); }}
                className="flex items-center gap-2 px-2 py-1.5 text-sm outline-none hover:bg-destructive hover:text-white rounded-md cursor-pointer group"
              >
                <LogOut className="size-4 opacity-70 group-hover:opacity-100 group-hover:text-white" /> Log out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}

function SessionItem({ 
  session, 
  active, 
  folders,
  onDelete,
  onMove
}: { 
  session: ResearchSession; 
  active: boolean; 
  folders: Folder[];
  onDelete: () => void;
  onMove: (folderId: string | null) => void;
}) {
  return (
    <div className={`group flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors ${active ? 'bg-gray-200/60 dark:bg-gray-800 text-brand-dark dark:text-white' : 'hover:bg-gray-200/40 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
      <Link to={`/research/${session.id}`} className="flex items-center gap-2.5 flex-1 min-w-0">
        <MessageSquare className="size-3.5 flex-shrink-0 opacity-60" />
        <span className="text-sm truncate">{session.topic || "Untitled Research"}</span>
      </Link>
      
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-opacity outline-none">
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" className="z-50 min-w-[180px] bg-white dark:bg-[#2a2a2a] rounded-lg p-1.5 shadow-xl border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 animate-in fade-in-0 zoom-in-95">
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="flex items-center justify-between px-2 py-1.5 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer">
                <div className="flex items-center gap-2"><FolderIcon className="size-3.5 opacity-70" /> Move to...</div>
                <ChevronRight className="size-3.5 opacity-50" />
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent className="z-50 min-w-[160px] bg-white dark:bg-[#2a2a2a] rounded-lg p-1.5 shadow-xl border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 animate-in fade-in-0 zoom-in-95" sideOffset={6} alignOffset={-5}>
                  <DropdownMenu.Item 
                    onClick={() => onMove(null)}
                    className="px-2 py-1.5 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer italic text-gray-500"
                  >
                    Remove from folder
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-1" />
                  {folders.map(f => (
                    <DropdownMenu.Item 
                      key={f.id}
                      onClick={() => onMove(f.id)}
                      className="px-2 py-1.5 text-sm outline-none hover:bg-brand hover:text-white rounded-md cursor-pointer font-medium"
                    >
                      {f.name}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>

            <DropdownMenu.Separator className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-1" />
            <DropdownMenu.Item 
              onClick={onDelete}
              className="flex items-center gap-2 px-2 py-1.5 text-sm outline-none hover:bg-destructive hover:text-destructive-foreground rounded-md cursor-pointer text-destructive group"
            >
              <Trash className="size-3.5 opacity-70 group-hover:opacity-100 group-hover:text-white" /> Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
