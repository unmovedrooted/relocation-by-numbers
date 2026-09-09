import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ cityId: string }>;
};

export default async function CostOfLivingInRedirectPage({ params }: Props) {
  const { cityId } = await params;
  redirect(`/cost-of-living/${cityId}`);
}
