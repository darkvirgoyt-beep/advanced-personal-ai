import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { resolveWorkspacePreview } from "@/lib/workspacePreview";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ChevronLeft, Code2, FileCode2, FilePlus2, FolderGit2, Loader2, Play,
  Plus, Save, TerminalSquare, Trash2, X, ExternalLink, Github, Sparkles,
} from "lucide-react";

type ProjectFile = { id: number; path: string; size: number; updatedAt: Date | string };
type Project = { id: number; name: string; description: string | null; githubRepoFullName: string | null; runCommand: string };

const starterHtml = (name: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0b1020; color: #e9edff; font-family: Inter, system-ui, sans-serif; }
      main { max-width: 42rem; padding: 3rem; border: 1px solid #263252; border-radius: 1.25rem; background: #111a31; box-shadow: 0 24px 80px rgba(0,0,0,.35); }
      h1 { color: #9db7ff; margin-top: 0; } code { color: #74e0bd; }
    </style>
  </head>
  <body>
    <main>
      <h1>${name}</h1>
      <p>Built in <code>Nova AI by VirgoYT</code>.</p>
      <p>Edit <code>index.html</code>, press Save, and the preview updates here.</p>
    </main>
  </body>
</html>`;

function fileLanguage(filePath: string): string {
  const extension = filePath.split(".").pop()?.toLowerCase();
  return ({ html: "HTML", css: "CSS", js: "JavaScript", ts: "TypeScript", tsx: "TSX", jsx: "JSX", json: "JSON", md: "Markdown", py: "Python", cpp: "C++", cs: "C#" } as Record<string, string>)[extension || ""] || "Text";
}

function defaultRunCommand(files: ProjectFile[]): string {
  if (files.some(file => file.path === "package.json")) return "npm run dev";
  if (files.some(file => file.path.endsWith(".py"))) return "python main.py";
  if (files.some(file => file.path.endsWith(".js"))) return "node index.js";
  return "echo 'Static project: edit index.html and use the Preview panel'";
}

export default function WorkspacePage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const projectsQuery = trpc.projects.list.useQuery();
  const createProject = trpc.projects.create.useMutation();
  const deleteProject = trpc.projects.delete.useMutation();
  const updateProject = trpc.projects.update.useMutation();
  const saveFile = trpc.projects.saveFile.useMutation();
  const deleteFile = trpc.projects.deleteFile.useMutation();
  const runProject = trpc.projects.run.useMutation();
  const githubReposQuery = trpc.git.listGitHubRepos.useQuery();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectGithubRepo, setProjectGithubRepo] = useState("");
  const [linkedRepoDraft, setLinkedRepoDraft] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [runCommand, setRunCommand] = useState("");
  const [runOutput, setRunOutput] = useState("Ready. Run a bounded project command to see output here.");
  const saveRef = useRef<() => Promise<void>>(async () => {});

  const projects = (projectsQuery.data?.projects || []) as Project[];
  const selectedProject = projects.find(project => project.id === selectedProjectId) || null;
  const filesQuery = trpc.projects.files.useQuery({ projectId: selectedProjectId || 0 }, { enabled: !!selectedProjectId });
  const files = (filesQuery.data?.files || []) as ProjectFile[];
  const readFileQuery = trpc.projects.readFile.useQuery(
    { projectId: selectedProjectId || 0, path: selectedPath || "index.html" },
    { enabled: !!selectedProjectId && !!selectedPath },
  );
  const isDirty = !!selectedPath && editorContent !== savedContent;
  const hasIndexHtml = files.some(file => file.path === "index.html");
  const previewFileQuery = trpc.projects.readFile.useQuery(
    { projectId: selectedProjectId || 0, path: "index.html" },
    { enabled: !!selectedProjectId && hasIndexHtml },
  );
  const previewDocument = useMemo(() => resolveWorkspacePreview({
    selectedPath,
    editorContent,
    savedIndexHtml: previewFileQuery.data?.content,
  }), [editorContent, previewFileQuery.data?.content, selectedPath]);

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) setSelectedProjectId(projects[0].id);
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (!selectedProject) return;
    setRunCommand(selectedProject.runCommand || defaultRunCommand(files));
  }, [selectedProject, files]);

  useEffect(() => {
    if (!selectedPath && files.length > 0) setSelectedPath(files.find(file => file.path === "index.html")?.path || files[0].path);
    if (selectedPath && !files.some(file => file.path === selectedPath)) setSelectedPath(files[0]?.path || null);
  }, [files, selectedPath]);

  useEffect(() => {
    if (readFileQuery.data) {
      setEditorContent(readFileQuery.data.content);
      setSavedContent(readFileQuery.data.content);
    }
  }, [readFileQuery.data?.content, selectedPath]);

  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem("nova-active-development-project", JSON.stringify({
        id: selectedProject.id,
        name: selectedProject.name,
        path: selectedPath || undefined,
      }));
    }
  }, [selectedPath, selectedProject]);

  useEffect(() => {
    setLinkedRepoDraft(selectedProject?.githubRepoFullName || "");
  }, [selectedProject?.id, selectedProject?.githubRepoFullName]);

  const persistFile = async () => {
    if (!selectedProjectId || !selectedPath) return;
    try {
      await saveFile.mutateAsync({ projectId: selectedProjectId, path: selectedPath, content: editorContent });
      setSavedContent(editorContent);
      await utils.projects.files.invalidate({ projectId: selectedProjectId });
      await utils.projects.readFile.invalidate({ projectId: selectedProjectId, path: selectedPath });
      if (selectedPath === "index.html") await utils.projects.readFile.invalidate({ projectId: selectedProjectId, path: "index.html" });
      toast.success(`${selectedPath} saved`);
    } catch (error: any) {
      toast.error(error.message || "Could not save source file");
    }
  };
  saveRef.current = persistFile;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const createStarterProject = async () => {
    const name = projectName.trim() || "Untitled project";
    try {
      const linkedRepository = projectGithubRepo.trim();
      const result = await createProject.mutateAsync({
        name,
        description: projectDescription.trim() || undefined,
        githubRepoFullName: linkedRepository || undefined,
        runCommand: "echo 'Static project: edit index.html and use the Preview panel'",
      });
      await saveFile.mutateAsync({ projectId: result.id, path: "index.html", content: starterHtml(name) });
      await saveFile.mutateAsync({ projectId: result.id, path: "README.md", content: `# ${name}\n\nCreated in Nova AI by VirgoYT.\n` });
      await utils.projects.list.invalidate();
      setSelectedProjectId(result.id);
      setSelectedPath("index.html");
      setShowNewProject(false);
      setProjectName("");
      setProjectDescription("");
      setProjectGithubRepo("");
      toast.success("Project created");
    } catch (error: any) {
      toast.error(error.message || "Could not create project");
    }
  };

  const addFile = async () => {
    if (!selectedProjectId) return;
    const path = window.prompt("New file path", "src/main.js")?.trim();
    if (!path) return;
    try {
      await saveFile.mutateAsync({ projectId: selectedProjectId, path, content: "" });
      await utils.projects.files.invalidate({ projectId: selectedProjectId });
      setSelectedPath(path.replace(/\\/g, "/").replace(/^\.\//, ""));
      toast.success("Source file added");
    } catch (error: any) {
      toast.error(error.message || "Could not add file");
    }
  };

  const removeFile = async () => {
    if (!selectedProjectId || !selectedPath || !window.confirm(`Delete ${selectedPath}?`)) return;
    try {
      await deleteFile.mutateAsync({ projectId: selectedProjectId, path: selectedPath });
      setSelectedPath(null);
      await utils.projects.files.invalidate({ projectId: selectedProjectId });
      toast.success("Source file removed");
    } catch (error: any) {
      toast.error(error.message || "Could not remove source file");
    }
  };

  const runCurrentProject = async () => {
    if (!selectedProjectId || !selectedProject) return;
    if (isDirty) {
      toast.message("Saving your open file before running");
      await persistFile();
    }
    setRunOutput("Running in an isolated temporary workspace…");
    try {
      if (runCommand !== selectedProject.runCommand) {
        await updateProject.mutateAsync({ id: selectedProjectId, runCommand });
        await utils.projects.list.invalidate();
      }
      const result = await runProject.mutateAsync({ projectId: selectedProjectId, command: runCommand });
      const status = result.exitCode === 0 ? "Process completed" : `Process exited with ${result.exitCode}`;
      setRunOutput(`${status}\n\n${result.stdout || ""}${result.stderr ? `\n${result.stderr}` : ""}`.trim());
    } catch (error: any) {
      setRunOutput(error.message || "Could not run project");
    }
  };

  const saveProjectRepository = async () => {
    if (!selectedProject) return;
    try {
      await updateProject.mutateAsync({ id: selectedProject.id, githubRepoFullName: linkedRepoDraft || null });
      await utils.projects.list.invalidate();
      toast.success(linkedRepoDraft ? "GitHub repository linked to this project" : "GitHub repository link removed");
    } catch (error: any) {
      toast.error(error.message || "Could not update the project repository");
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#090d18] text-slate-100">
      <header className="flex h-12 items-center gap-2 border-b border-white/10 bg-[#111827] px-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/chat")} className="h-8 text-slate-300 hover:bg-white/10 hover:text-white">
          <ChevronLeft className="mr-1 h-4 w-4" /> Nova AI
        </Button>
        <span className="hidden text-xs text-slate-500 sm:inline">/</span>
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium"><Code2 className="h-4 w-4 text-indigo-300" /> Workspace</div>
        {selectedProject && <span className="truncate text-xs text-slate-400">{selectedProject.name}</span>}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/chat")} className="hidden h-8 text-xs text-slate-300 hover:bg-white/10 hover:text-white sm:flex"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Ask Nova</Button>
          <Button size="sm" onClick={runCurrentProject} disabled={!selectedProject || runProject.isPending} className="h-8 bg-emerald-500 text-xs text-slate-950 hover:bg-emerald-400">
            {runProject.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />} Run
          </Button>
        </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-3rem)]">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-[#0d1322]">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Projects</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => setShowNewProject(true)}><Plus className="h-4 w-4" /></Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {projectsQuery.isLoading && <p className="p-2 text-xs text-slate-500">Loading projects…</p>}
                {projects.map(project => (
                  <button key={project.id} onClick={() => { setSelectedProjectId(project.id); setSelectedPath(null); }} className={cn("mb-1 w-full rounded-md px-2.5 py-2 text-left transition", selectedProjectId === project.id ? "bg-indigo-500/20 text-indigo-100" : "text-slate-300 hover:bg-white/5")}>
                    <div className="flex items-center gap-2"><FolderGit2 className="h-3.5 w-3.5 shrink-0 text-indigo-300" /><span className="truncate text-sm font-medium">{project.name}</span></div>
                    {project.githubRepoFullName && <p className="mt-1 truncate pl-5 text-[10px] text-slate-500">{project.githubRepoFullName}</p>}
                  </button>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t border-white/10 p-2">
              <Button variant="outline" onClick={() => setShowNewProject(true)} className="w-full border-white/15 bg-transparent text-xs text-slate-200 hover:bg-white/10 hover:text-white"><Plus className="mr-1.5 h-3.5 w-3.5" /> New project</Button>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-white/10" />

        <ResizablePanel defaultSize={48} minSize={30}>
          {selectedProject ? (
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={68} minSize={36} className="bg-[#0b1020]">
                <div className="flex h-full">
                  <aside className="w-44 shrink-0 border-r border-white/10 bg-[#0d1322]">
                    <div className="flex items-center justify-between border-b border-white/10 px-2 py-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-400">Files</span>
                      <Button variant="ghost" size="icon" onClick={addFile} className="h-6 w-6 text-slate-300 hover:bg-white/10 hover:text-white"><FilePlus2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    <ScrollArea className="h-[calc(100%-2.25rem)]">
                      <div className="p-1">
                        {files.map(file => <button key={file.id} onClick={() => setSelectedPath(file.path)} className={cn("flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-xs", selectedPath === file.path ? "bg-indigo-500/20 text-indigo-100" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}><FileCode2 className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{file.path}</span></button>)}
                        {!files.length && <p className="p-2 text-xs text-slate-500">No files yet.</p>}
                      </div>
                    </ScrollArea>
                  </aside>
                  <section className="flex min-w-0 flex-1 flex-col">
                    <div className="flex h-9 items-center gap-2 border-b border-white/10 bg-[#10172a] px-3">
                      <FileCode2 className="h-3.5 w-3.5 text-indigo-300" />
                      <span className="truncate text-xs text-slate-200">{selectedPath || "Choose a file"}</span>
                      {selectedPath && <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500">{fileLanguage(selectedPath)}</span>}
                      {isDirty && <span className="text-[10px] text-amber-300">Unsaved</span>}
                      <div className="ml-auto flex items-center gap-1">
                        {selectedPath && <Button variant="ghost" size="icon" onClick={removeFile} className="h-6 w-6 text-slate-400 hover:bg-red-500/10 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></Button>}
                        <Button size="sm" onClick={persistFile} disabled={!selectedPath || !isDirty || saveFile.isPending} className="h-6 bg-indigo-500 px-2 text-[11px] hover:bg-indigo-400"><Save className="mr-1 h-3 w-3" /> Save</Button>
                      </div>
                    </div>
                    {readFileQuery.isLoading ? <div className="grid flex-1 place-items-center text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /></div> : selectedPath ? (
                      <Textarea value={editorContent} onChange={event => setEditorContent(event.target.value)} spellCheck={false} className="h-full flex-1 resize-none rounded-none border-0 bg-[#0b1020] p-4 font-mono text-[13px] leading-6 text-slate-200 focus-visible:ring-0" aria-label={`Source editor for ${selectedPath}`} />
                    ) : <div className="grid flex-1 place-items-center p-6 text-center text-sm text-slate-500">Create or select a source file to begin editing.</div>}
                  </section>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-white/10" />
              <ResizablePanel defaultSize={32} minSize={20} className="bg-[#080c16]">
                <div className="flex h-full flex-col">
                  <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2"><TerminalSquare className="h-3.5 w-3.5 text-emerald-300" /><span className="text-xs font-medium text-slate-200">Run output</span><span className="text-[10px] text-slate-500">Commands run for up to 30 seconds in a temporary project copy.</span></div>
                  <div className="flex items-center gap-2 border-b border-white/10 p-2"><span className="text-xs text-emerald-400">$</span><Input value={runCommand} onChange={event => setRunCommand(event.target.value)} className="h-7 border-white/10 bg-[#10172a] font-mono text-xs text-slate-100" aria-label="Project run command" /><Button size="sm" onClick={runCurrentProject} disabled={runProject.isPending} className="h-7 bg-emerald-500 px-2 text-xs text-slate-950 hover:bg-emerald-400"><Play className="mr-1 h-3 w-3 fill-current" /> Run</Button></div>
                  <ScrollArea className="flex-1"><pre className="whitespace-pre-wrap p-3 font-mono text-xs leading-5 text-slate-300">{runOutput}</pre></ScrollArea>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="grid h-full place-items-center p-8"><div className="max-w-md text-center"><Code2 className="mx-auto mb-4 h-10 w-10 text-indigo-300" /><h1 className="text-xl font-semibold">Your Nova development workspace</h1><p className="mt-2 text-sm text-slate-400">Create a project to edit source files, preview HTML, run bounded commands, and use Nova as your coding partner.</p><Button className="mt-5 bg-indigo-500 hover:bg-indigo-400" onClick={() => setShowNewProject(true)}><Plus className="mr-2 h-4 w-4" /> Create project</Button></div></div>
          )}
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-white/10" />

        <ResizablePanel defaultSize={32} minSize={22} className="bg-[#0d1322]">
          <div className="flex h-full flex-col">
            <div className="flex items-center border-b border-white/10 px-3 py-2"><ExternalLink className="mr-2 h-3.5 w-3.5 text-cyan-300" /><span className="text-xs font-medium">Live preview</span></div>
            {previewFileQuery.isLoading && hasIndexHtml ? <div className="grid flex-1 place-items-center text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /></div> : previewDocument ? <iframe title="Project HTML preview" sandbox="allow-scripts" srcDoc={previewDocument} className="h-full w-full bg-white" /> : <div className="grid flex-1 place-items-center p-6 text-center"><div><Code2 className="mx-auto mb-3 h-7 w-7 text-slate-600" /><p className="text-sm text-slate-400">Preview is ready for <code className="text-cyan-300">index.html</code></p><p className="mt-1 text-xs text-slate-600">Add an HTML entry file, then save it to see a safe static preview here.</p></div></div>}
            <div className="border-t border-white/10 p-2">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-400"><Github className="h-3.5 w-3.5" /> Project GitHub repository</div>
              {githubReposQuery.data?.connected ? <div className="flex gap-1"><select value={linkedRepoDraft} onChange={event => setLinkedRepoDraft(event.target.value)} className="h-7 min-w-0 flex-1 rounded border border-white/10 bg-[#10172a] px-1.5 text-[11px] text-slate-200"><option value="">No linked repository</option>{githubReposQuery.data.repos.map(repo => <option key={repo.id} value={repo.fullName}>{repo.fullName}</option>)}</select><Button size="sm" onClick={saveProjectRepository} disabled={!selectedProject || updateProject.isPending} className="h-7 bg-indigo-500 px-2 text-[11px] hover:bg-indigo-400">Link</Button></div> : <button onClick={() => navigate("/git")} className="text-left text-[11px] text-cyan-300 hover:underline">Connect GitHub to link a repository</button>}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {showNewProject && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><div className="w-full max-w-md rounded-xl border border-white/10 bg-[#151c30] p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-semibold">New project</h2><Button variant="ghost" size="icon" onClick={() => setShowNewProject(false)} className="h-7 w-7 text-slate-300"><X className="h-4 w-4" /></Button></div><p className="mt-1 text-xs text-slate-400">Nova creates an editable HTML starter with a live preview.</p><label className="mt-4 block text-xs text-slate-300">Project name<Input autoFocus value={projectName} onChange={event => setProjectName(event.target.value)} placeholder="My new app" className="mt-1 border-white/10 bg-[#0c1222]" /></label><label className="mt-3 block text-xs text-slate-300">Description <span className="text-slate-500">(optional)</span><Input value={projectDescription} onChange={event => setProjectDescription(event.target.value)} placeholder="What are you building?" className="mt-1 border-white/10 bg-[#0c1222]" /></label><label className="mt-3 block text-xs text-slate-300">GitHub repository <span className="text-slate-500">(optional)</span>{githubReposQuery.data?.connected ? <select value={projectGithubRepo} onChange={event => setProjectGithubRepo(event.target.value)} className="mt-1 h-9 w-full rounded border border-white/10 bg-[#0c1222] px-2 text-sm text-slate-200"><option value="">No linked repository</option>{githubReposQuery.data.repos.map(repo => <option key={repo.id} value={repo.fullName}>{repo.fullName}</option>)}</select> : <p className="mt-1 text-[11px] text-slate-500">Connect GitHub from the Git page first to choose a verified repository.</p>}</label><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowNewProject(false)} className="border-white/15 bg-transparent text-slate-200 hover:bg-white/10">Cancel</Button><Button onClick={createStarterProject} disabled={createProject.isPending || saveFile.isPending} className="bg-indigo-500 hover:bg-indigo-400">{(createProject.isPending || saveFile.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create project</Button></div></div></div>}
    </div>
  );
}
