import CustomButton from "../../../components/UI/CustomButton/CustomButton";

function MassagesPreview() {
    return (
        <div
            className="relative w-full  bg-brown_primary-middle  text-white text-center py-20 px-6 "

        >
            <div className="relative z-10 max-w-4xl mx-auto space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-wide">
                    Процедуры
                </h1>
                <p className="text-2xl sm:text-3xl font-extralight text-amber-100 leading-relaxed">
                    Массаж для детей и взрослых
                </p>
                <p className="text-lg sm:text-xl font-light text-amber-200 max-w-2xl mx-auto">
                    Разные техники парения
                </p>
                <div className="mt-8">
                    <CustomButton
                        to="/kitchen"
                        text="Подробнее о массаже"
                        variant="green"
                   
                    />
                </div>
            </div>
        </div>
    );
}

export default MassagesPreview;