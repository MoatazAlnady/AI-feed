const Index = () => {
  return (
    <div className="p-6">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Welcome to AI Nexus Platform</h1>
        <p className="text-xl text-muted-foreground mb-8">
          The unified SaaS platform connecting AI-skilled creators with innovative employers
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">AI Tools Directory</h3>
            <p className="text-muted-foreground">Discover curated AI tools and resources</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Talent Marketplace</h3>
            <p className="text-muted-foreground">Find skilled AI creators and professionals</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Project Management</h3>
            <p className="text-muted-foreground">Manage projects and collaborate seamlessly</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
