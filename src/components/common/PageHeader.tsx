import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus } from "lucide-react";

const PageHeader = (props) => {
    const {
        page,
        heading,
        subHeading,
        fetchHandler,
        isLoading,
        openModal,
    } = props;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-between">

                    <div className="flex items-center gap-4">
                        {/* Heading & SubHeading */}
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-green via-brand-teal to-brand-blue bg-clip-text text-transparent">
                                {heading}
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                {subHeading}
                            </p>
                        </div>
                    </div>

                    {page?.toLowerCase() === "admin" && (
                        <Button className="bg-brand-green hover:bg-brand-green/90 text-white" onClick={openModal}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Admin
                        </Button>
                    )}
                    {/* create permission button removed */}
                    
                    {page?.toLowerCase() === "roles" && (
                        <Button className="bg-brand-green hover:bg-brand-green/90 text-white" onClick={openModal}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Role
                        </Button>
                    )}

                </div>
            </motion.div>
        </>
    )
};

export default PageHeader;
