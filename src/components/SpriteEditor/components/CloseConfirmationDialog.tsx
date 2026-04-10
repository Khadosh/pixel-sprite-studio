import React from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Save, Trash2, XCircle } from 'lucide-react';

interface CloseConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmSave: () => void;
  onConfirmDiscard: () => void;
}

export const CloseConfirmationDialog: React.FC<CloseConfirmationDialogProps> = ({
  open,
  onOpenChange,
  onConfirmSave,
  onConfirmDiscard,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[400px] border-[6px] border-primary bg-card p-8 shadow-[12px_12px_0_0_rgba(0,0,0,0.6)] font-pixel select-none animate-in fade-in zoom-in duration-200">
        <AlertDialogHeader className="space-y-6">
          <div className="flex justify-center py-2">
            <div className="w-20 h-20 bg-destructive/10 border-[6px] border-destructive flex items-center justify-center shadow-[6px_6px_0_0_rgba(239,68,68,0.2)]">
              <AlertTriangle className="text-destructive scale-125" size={32} strokeWidth={3} />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-primary text-sm tracking-tight leading-relaxed font-pixel">
            ¡ALERTA! <br/>
            TRABAJO NO GUARDADO
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-[10px] text-muted-foreground leading-loose font-pixel uppercase">
            ¿Deseas guardar tus píxeles antes de retirarte o prefieres descartar el progreso actual?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-4 mt-8">
          <Button
            onClick={onConfirmSave}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-pixel text-[11px] h-14 border-b-4 border-r-4 border-primary/40 rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all uppercase"
          >
            <Save className="mr-3" size={18} /> GUARDAR Y SALIR
          </Button>

          <Button
            variant="destructive"
            onClick={onConfirmDiscard}
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-pixel text-[11px] h-14 border-b-4 border-r-4 border-destructive/40 rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all uppercase"
          >
            <Trash2 className="mr-3" size={18} /> DESCARTAR CAMBIOS
          </Button>

          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              className="w-full font-pixel text-[10px] h-12 border-[4px] border-muted-foreground/30 text-muted-foreground hover:bg-secondary rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all uppercase mt-2"
            >
              <XCircle className="mr-3" size={16} /> SEGUIR EDITANDO
            </Button>
          </AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
