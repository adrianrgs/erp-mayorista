import React, { createContext, useContext, useState, ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type DialogType = "alert" | "confirm";

interface DialogOptions {
  title?: string;
  message: string | React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "info" | "warning" | "danger" | "success";
  requireInputToConfirm?: string;
}

interface DialogContextValue {
  showAlert: (opts: DialogOptions) => void;
  showConfirm: (opts: DialogOptions) => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>("alert");
  const [options, setOptions] = useState<DialogOptions>({ message: "" });
  const [inputValue, setInputValue] = useState("");

  const showAlert = (opts: DialogOptions) => {
    setDialogType("alert");
    setOptions(opts);
    setInputValue("");
    setIsOpen(true);
  };

  const showConfirm = (opts: DialogOptions) => {
    setDialogType("confirm");
    setOptions(opts);
    setInputValue("");
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (options.onCancel) {
      options.onCancel();
    }
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (options.onConfirm) {
      options.onConfirm();
    }
  };

  const IconMap = {
    info: <Info className="w-6 h-6 text-blue-500" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    danger: <AlertCircle className="w-6 h-6 text-red-500" />,
    success: <CheckCircle2 className="w-6 h-6 text-green-500" />,
  };

  const currentIcon = options.type ? IconMap[options.type] : IconMap["info"];

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm animate-fade-in font-sans p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up border border-zinc-200">
            {/* Header */}
            <div className="flex justify-between items-start p-5 pb-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${options.type === "danger" ? "bg-red-50" : options.type === "warning" ? "bg-amber-50" : options.type === "success" ? "bg-green-50" : "bg-blue-50"}`}>
                  {currentIcon}
                </div>
                {options.title && (
                  <h3 className="text-lg font-bold text-zinc-900">{options.title}</h3>
                )}
              </div>
              <button 
                onClick={handleClose}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-5 pt-4 text-sm text-zinc-600 leading-relaxed pl-[4.25rem]">
              <div className="mb-2">{options.message}</div>
              {options.requireInputToConfirm && (
                <div className="mt-4">
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Escriba <span className="font-mono bg-zinc-100 px-1 rounded select-all">{options.requireInputToConfirm}</span> para confirmar:
                  </label>
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 font-mono text-sm"
                    placeholder={options.requireInputToConfirm}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-3">
              {dialogType === "confirm" && (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-md text-sm font-semibold hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  {options.cancelText || "Cancelar"}
                </button>
              )}
              <button
                onClick={handleConfirm}
                disabled={options.requireInputToConfirm ? inputValue !== options.requireInputToConfirm : false}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed
                  ${options.type === "danger" ? "bg-red-600 hover:bg-red-700" : 
                    options.type === "warning" ? "bg-amber-600 hover:bg-amber-700" : 
                    options.type === "success" ? "bg-green-600 hover:bg-green-700" : 
                    "bg-zinc-900 hover:bg-zinc-800"}`}
              >
                {options.confirmText || (dialogType === "confirm" ? "Confirmar" : "Aceptar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
