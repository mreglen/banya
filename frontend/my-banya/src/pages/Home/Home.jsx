import ListBaths from "./ListBaths/ListBaths";
import KitchenPreview from "./KitchenPreview/KitchenPreview";
import MassagesPreview from "./MassagesPreview/MassagesPreview";
import ContactSection from "./ContactSection/ContactSection";


function Home() {
    return (
        <div>
            <div
                className="relative w-full h-screen bg-cover bg-center"
                style={{
                    backgroundImage: "url('/img/bg-home.png')",
                }}
            >

                <div className="absolute inset-0 bg-gray-900 bg-opacity-50"></div>

                <div className="relative flex items-center justify-center h-full text-white flex-col gap-10 ">
                    <h1 className="text-7xl font-light">Николаевские бани</h1>
                    <p className="text-3xl max-w-4xl text-center font-extralight">Это атмосфера настоящей русской бани на дровах с вековыми традициями. Мы востанавливаем силы и душевное тепло.</p>
                </div>
            </div>

            <ListBaths />
            <KitchenPreview />
            <MassagesPreview />
            <ContactSection />
        </div>
    );
}

export default Home;