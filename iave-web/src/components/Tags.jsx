import Stats from './tags/Stats.jsx';
import TagsTable from './tags/TagsTable';



const TagsModule = () => {


    return (
        <div className="container-fluid py-4">
            <h1 className="h3 mb-4 text-gray-800">Gestión de TAGs</h1>
            <div>
                <Stats />
            </div>
            <TagsTable />
        </div>


    );
};

export default TagsModule;
