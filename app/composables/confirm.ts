import ConfirmDialog from "~/components/modals/ConfirmDialog.vue";

export const useConfirm = createSharedComposable(() => {
  const overlay = useOverlay();
  return overlay.create(ConfirmDialog);
});
