import ModalConfirm from "~/components/modal/Confirm.vue";

export const useConfirm = createSharedComposable(() => {
  const overlay = useOverlay();
  return overlay.create(ModalConfirm);
});
