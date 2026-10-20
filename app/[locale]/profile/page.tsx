import { ProfileView } from "@/components/profile-view";
import { localeMetadata } from "@/lib/i18n/metadata";

export const generateMetadata = localeMetadata((dict) => dict.profile.title);

export default function Page() {
  return <ProfileView />;
}
