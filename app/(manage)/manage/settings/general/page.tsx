import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getStoreSettings } from "./actions";
import { CompanyAddressCard } from "./company-address-card";
import { GeneralCard } from "./general-card";
import { ReferralBadgeCard } from "./referral-badge-card";
import { TransferOwnershipCard } from "./transfer-ownership-card";

export default async function GeneralSettingsPage() {
	const settings = await getStoreSettings();

	return (
		<div className="space-y-6 pb-12">
			<DashboardHeader
				title="RÉGLAGES GÉNÉRAUX"
				description="Gérez les détails principaux de votre boutique, de son identité à ses informations de facturation."
			/>

			<div className="space-y-6">
				<GeneralCard
					settings={{
						name: settings.name,
						currency: settings.currency,
						language: settings.language,
					}}
				/>

				<CompanyAddressCard
					settings={{
						fullName: settings.fullName,
						companyName: settings.companyName,
						taxId: settings.taxId,
						address1: settings.address1,
						address2: settings.address2,
						postalCode: settings.postalCode,
						city: settings.city,
						state: settings.state,
						country: settings.country,
						phone: settings.phone,
					}}
				/>

				<ReferralBadgeCard showReferralBadge={settings.showReferralBadge ?? true} />

				<TransferOwnershipCard />
			</div>
		</div>
	);
}
