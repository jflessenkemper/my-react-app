// api/basiq-job-status.js

export default async function handler(req, res) {
  console.log('⏳ [BASIQ-JOB-STATUS] Request received');
  console.log('⏳ [BASIQ-JOB-STATUS] Method:', req.method);
  console.log('⏳ [BASIQ-JOB-STATUS] Query:', req.query);

  if (req.method !== 'GET') {
    console.log('❌ [BASIQ-JOB-STATUS] Invalid method:', req.method);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { jobId } = req.query;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ [BASIQ-JOB-STATUS] Missing or invalid authorization header');
    return res.status(401).json({ message: 'Authorization token required' });
  }

  if (!jobId) {
    console.log('❌ [BASIQ-JOB-STATUS] Missing job ID');
    return res.status(400).json({ message: 'Job ID is required' });
  }

  const accessToken = authHeader.split(' ')[1];

  try {
    console.log('⏳ [BASIQ-JOB-STATUS] Fetching job status for:', jobId);
    const jobResponse = await fetch(`https://au-api.basiq.io/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'basiq-version': '3.0'
      }
    });

    console.log('⏳ [BASIQ-JOB-STATUS] Job response status:', jobResponse.status);

    if (!jobResponse.ok) {
      const errorData = await jobResponse.text();
      console.error('❌ [BASIQ-JOB-STATUS] Job status error:', errorData);
      return res.status(jobResponse.status).json({
        message: 'Failed to fetch job status',
        details: errorData
      });
    }

    const jobData = await jobResponse.json();
    console.log('✅ [BASIQ-JOB-STATUS] Job status retrieved');
    console.log('✅ [BASIQ-JOB-STATUS] Job ID:', jobData.id);
    console.log('✅ [BASIQ-JOB-STATUS] Steps:', jobData.steps?.map(s => `${s.title}: ${s.status}`));

    // Check if all steps are completed
    const allStepsCompleted = jobData.steps?.every(step => step.status === 'success');
    const hasFailedSteps = jobData.steps?.some(step => step.status === 'failed');

    res.status(200).json({
      jobId: jobData.id,
      created: jobData.created,
      updated: jobData.updated,
      steps: jobData.steps,
      links: jobData.links,
      isComplete: allStepsCompleted,
      hasFailed: hasFailedSteps,
      status: allStepsCompleted ? 'completed' : hasFailedSteps ? 'failed' : 'in-progress'
    });

  } catch (error) {
    console.error('❌ [BASIQ-JOB-STATUS] Exception:', error);
    res.status(500).json({
      message: 'An internal server error occurred while checking job status.',
      error: error.message
    });
  }
}
