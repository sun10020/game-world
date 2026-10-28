import { Suspense } from "react";
import { Catalog } from "@/components/catalog";
import { AdSlot } from "@/components/ad-slot";
export const metadata={alternates:{canonical:"/"}};
export default function Home(){return <><Suspense fallback={<main id="main" className="page-content">Loading your next adventure...</main>}><Catalog/></Suspense><AdSlot placement="catalog-bottom"/></>;}
