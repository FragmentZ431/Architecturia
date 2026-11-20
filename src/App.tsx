
import { useEffect, useRef, useState } from 'react';
import {
  Box, DoorOpen, Move, MousePointer2, PanelTop, PencilRuler,
  Sofa, Waypoints, Camera, Compass, Clapperboard, Trash2,
  Save, FolderOpen, RotateCcw, RotateCw, Download, RefreshCw,
  CheckCircle, AlertCircle
} from 'lucide-react';
import { useAppStore, ToolMode } from './store';
import Plan2D from './editor/Plan2D';
import Scene3D from './editor/Scene3D';

type UpdateStatus = {
  state: string;
  message?: string;
  version?: string;
  percent?: number;
  details?: string;
};

declare global {
  interface Window {
    architecturiaUpdater: {
      checkForUpdates: () => Promise<UpdateStatus>;
      downloadUpdate: () => Promise<UpdateStatus>;
      installUpdate: () => Promise<UpdateStatus>;
      onStatus: (callback: (status: UpdateStatus) => void) => () => void;
    };
  }
}

const tools: { id: ToolMode; label: string; icon: any }[] = [
  { id: 'select', label: 'Sélection', icon: MousePointer2 },
  { id: 'move', label: 'Déplacer', icon: Move },
  { id: 'wall', label: 'Mur', icon: PencilRuler },
  { id: 'door', label: 'Porte', icon: DoorOpen },
  { id: 'window', label: 'Fenêtre', icon: PanelTop },
  { id: 'furniture', label: 'Mobilier', icon: Sofa },
  { id: 'pipe', label: 'Canalisation', icon: Waypoints }
];

export default function App() {
  const {
    view, setView, tool, setTool, renderStyle, toggleStyle,
    cameraMode, setCameraMode, items, selectedId, updateItem,
    removeSelected, level, setLevel
  } = useAppStore();

  const selected = items.find(i => i.id === selectedId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    state: 'idle',
    message: 'Aucune recherche effectuée.'
  });

  const [updateBusy, setUpdateBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = window.architecturiaUpdater.onStatus(status => {
      setUpdateStatus(status);

      if (
        status.state === 'available' ||
        status.state === 'not-available' ||
        status.state === 'downloaded' ||
        status.state === 'error'
      ) {
        setUpdateBusy(false);
      }
    });

    return unsubscribe;
  }, []);

  const checkUpdates = async () => {
    setUpdateBusy(true);

    try {
      const result = await window.architecturiaUpdater.checkForUpdates();

      if (result.state !== 'started') {
        setUpdateStatus(result);
        setUpdateBusy(false);
      }
    } catch {
      setUpdateStatus({
        state: 'error',
        message: 'Impossible de rechercher les mises à jour.'
      });
      setUpdateBusy(false);
    }
  };

  const downloadUpdate = async () => {
    setUpdateBusy(true);

    try {
      const result = await window.architecturiaUpdater.downloadUpdate();

      if (result.state !== 'started') {
        setUpdateStatus(result);
        setUpdateBusy(false);
      }
    } catch {
      setUpdateStatus({
        state: 'error',
        message: 'Le téléchargement a échoué.'
      });
      setUpdateBusy(false);
    }
  };

  const installUpdate = async () => {
    try {
      await window.architecturiaUpdater.installUpdate();
    } catch {
      setUpdateStatus({
        state: 'error',
        message: 'Impossible d’installer la mise à jour.'
      });
    }
  };

  const save = () => {
    const data = { format: 'Z431', version: 1, items, level };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projet-zone431.z431';
    a.click();
    URL.revokeObjectURL(url);
  };

  const changeAngle = (next: number) => {
    if (!selected) return;

    if (selected.type === 'wall') {
      const x2 = selected.x2 ?? selected.x;
      const y2 = selected.y2 ?? selected.y;
      const cx = (selected.x + x2) / 2;
      const cy = (selected.y + y2) / 2;
      const length = Math.hypot(x2 - selected.x, y2 - selected.y);
      const r = next * Math.PI / 180;

      updateItem(selected.id, {
        angle: next,
        x: cx - Math.cos(r) * length / 2,
        y: cy - Math.sin(r) * length / 2,
        x2: cx + Math.cos(r) * length / 2,
        y2: cy + Math.sin(r) * length / 2
      });
    } else {
      updateItem(selected.id, { angle: next });
    }
  };

  const load = (file: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));

        if (data.format !== 'Z431' || !Array.isArray(data.items)) {
          throw new Error('Format invalide');
        }

        useAppStore.setState({
          items: data.items,
          level: Number(data.level) || 0,
          selectedId: null
        });
      } catch {
        alert('Le fichier .z431 est invalide ou illisible.');
      }
    };

    reader.readAsText(file);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">431</div>

        <div className="brand-copy">
          <strong>ZONE-431 DESIGN</strong>
          <span>ÉDITEUR ARCHITECTURAL</span>
        </div>

        <div className="top-spacer" />

        <div className="project-name">
          <span className="status-dot" /> PROJET LOCAL
        </div>

        <button className="top-button" onClick={() => setView('2d')}>2D</button>
        <button className="top-button" onClick={() => setView('3d')}>3D</button>

        <button className="top-button" onClick={save}>
          <Save size={14} /> Enregistrer
        </button>

        <button className="top-button" onClick={() => fileRef.current?.click()}>
          <FolderOpen size={14} /> Ouvrir
        </button>

        <input
          ref={fileRef}
          hidden
          type="file"
          accept=".z431,application/json"
          onChange={e => e.target.files?.[0] && load(e.target.files[0])}
        />
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="side-heading">OUTILS DE CONCEPTION</div>

          {tools.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={'tool-button ' + (tool === id ? 'active' : '')}
              onClick={() => setTool(id)}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}

          <div className="side-divider" />

          <div className="side-heading">STRUCTURE</div>

          <div className="level-control">
            <button onClick={() => setLevel(Math.max(0, level - 1))}>−</button>
            <span>NIVEAU {level + 1}</span>
            <button onClick={() => setLevel(level + 1)}>+</button>
          </div>

          <button className="tool-button" onClick={() => setTool('select')}>
            <Box size={17} />
            <span>Objets : {items.filter(i => i.level === level).length}</span>
          </button>

          <div className="side-divider" />

          <div className="side-heading">MISES À JOUR</div>

          <div className="update-panel">
            <div className="update-status">
              {updateStatus.state === 'downloaded' ? (
                <CheckCircle size={16} />
              ) : updateStatus.state === 'error' ? (
                <AlertCircle size={16} />
              ) : (
                <RefreshCw size={16} />
              )}

              <span>{updateStatus.message}</span>
            </div>

            {updateStatus.version && (
              <div className="update-version">
                Version disponible : {updateStatus.version}
              </div>
            )}

            {updateStatus.state === 'downloading' && (
              <div className="update-progress">
                <div className="update-progress-track">
                  <div
                    className="update-progress-fill"
                    style={{ width: `${updateStatus.percent ?? 0}%` }}
                  />
                </div>
                <span>{updateStatus.percent ?? 0}%</span>
              </div>
            )}

            <button
              className="update-button"
              onClick={checkUpdates}
              disabled={updateBusy}
            >
              <RefreshCw size={14} />
              Rechercher les mises à jour
            </button>

            {updateStatus.state === 'available' && (
              <button
                className="update-button update-primary"
                onClick={downloadUpdate}
                disabled={updateBusy}
              >
                <Download size={14} />
                Télécharger la mise à jour
              </button>
            )}

            {updateStatus.state === 'downloaded' && (
              <button
                className="update-button update-primary"
                onClick={installUpdate}
              >
                <CheckCircle size={14} />
                Installer et redémarrer
              </button>
            )}

            {updateStatus.state === 'error' && updateStatus.details && (
              <div className="update-error-details">
                {updateStatus.details}
              </div>
            )}
          </div>

          <div className="sidebar-note">
            VERSION 0.2.2<br />
            Édition 2D active · aperçu 3D synchronisé
          </div>
        </aside>

        <section className="editor-area">
          <div className="editor-toolbar">
            <div className="view-label">
              {view === '2d' ? 'PLAN ARCHITECTURAL' : 'ENVIRONNEMENT 3D'}
            </div>

            <div className="toolbar-spacer" />

            {view === '3d' && (
              <>
                <button
                  className={'mode-button ' + (cameraMode === 'edit' ? 'selected' : '')}
                  onClick={() => setCameraMode('edit')}
                >
                  <MousePointer2 size={15} /> Édition
                </button>

                <button
                  className={'mode-button ' + (cameraMode === 'navigate' ? 'selected' : '')}
                  onClick={() => setCameraMode('navigate')}
                >
                  <Compass size={15} /> Navigation
                </button>

                <button
                  className={'mode-button ' + (cameraMode === 'cinematic' ? 'selected' : '')}
                  onClick={() => setCameraMode('cinematic')}
                >
                  <Clapperboard size={15} /> Cinématique
                </button>
              </>
            )}

            {view === '2d' && (
              <>
                <span className="angle-label">ANGLE</span>

                <input
                  className="angle-input"
                  type="number"
                  value={selected?.angle ?? 0}
                  onChange={e => changeAngle(Number(e.target.value))}
                  disabled={!selected}
                />

                <button
                  className="mode-button"
                  disabled={!selected}
                  onClick={() => changeAngle(((selected?.angle ?? 0) + 15) % 360)}
                >
                  <RotateCw size={14} />
                </button>

                <button
                  className="mode-button"
                  disabled={!selected}
                  onClick={() => changeAngle(((selected?.angle ?? 0) + 345) % 360)}
                >
                  <RotateCcw size={14} />
                </button>

                <button
                  className="mode-button danger"
                  disabled={!selected}
                  onClick={removeSelected}
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </>
            )}
          </div>

          <div className="canvas-wrap">
            {view === '2d' ? <Plan2D /> : <Scene3D />}
          </div>

          <footer className="statusbar">
            <span>{view.toUpperCase()} · {tool.toUpperCase()}</span>
            <span>
              {selected
                ? `SÉLECTION : ${selected.name}`
                : 'AUCUN OBJET SÉLECTIONNÉ'}
            </span>
            <span>UNITÉS : MÈTRES</span>
          </footer>
        </section>
      </div>

      <button className="style-switch" onClick={toggleStyle}>
        <Camera size={16} />
        <span>
          STYLE : {renderStyle === 'realistic' ? 'RÉALISTE' : 'MODULAIRE'}
        </span>
      </button>
    </main>
  );
}
