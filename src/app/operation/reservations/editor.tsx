import { CmsEditorRoute } from 'shared/cms-pages/cms-editor-route';

export default function ReservationsEditorPage() {
  return <CmsEditorRoute fallbackHref='/operation/reservations' pageKey='reservations' />;
}
