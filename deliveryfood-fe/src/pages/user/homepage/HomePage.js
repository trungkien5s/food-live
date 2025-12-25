import Layout from "../../../components/layout/Layout"
import HeroSection from "../../../components/sections/HeroSections"
import NearbyRestaurants from "../../../components/sections/NearbyRestaurants"
import NewShop from "../../../components/sections/NewShop"
import SpecialDealsSection from "../../../components/sections/SpecialDealsSection"

export default function HomePage() {
  return (
    <Layout>
      <HeroSection />
      {/* <ProductCategories /> */}
      <NewShop />
      <SpecialDealsSection />  
      {/* <NearbyRestaurants/> */}
      
    </Layout>
  )
}