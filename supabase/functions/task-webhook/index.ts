import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      title,
      description,
      priority,
      due_date,
      user_id,
      organization_id,
      project_name,
    } = body;

    if (!title) {
      return new Response(JSON.stringify({ error: 'title is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve project by name (default: "Viab")
    const targetProjectName = project_name || 'Viab';
    let projectId: string | null = null;

    const projectQuery = supabase
      .from('projects')
      .select('id')
      .ilike('name', targetProjectName)
      .eq('user_id', user_id);

    if (organization_id) {
      projectQuery.eq('organization_id', organization_id);
    }

    const { data: projects } = await projectQuery.limit(1);

    if (projects && projects.length > 0) {
      projectId = projects[0].id;
    } else {
      // Auto-create the project if it doesn't exist
      const projectInsert: Record<string, unknown> = {
        name: targetProjectName,
        user_id,
        status: 'active',
      };
      if (organization_id) {
        projectInsert.organization_id = organization_id;
        projectInsert.visibility = 'organization';
      }
      const { data: newProject, error: createErr } = await supabase
        .from('projects')
        .insert(projectInsert)
        .select('id')
        .single();

      if (createErr) {
        console.error('Error creating project:', createErr);
      } else {
        projectId = newProject.id;
      }
    }

    // Create the task
    const taskData: Record<string, unknown> = {
      title,
      user_id,
      priority: priority || 'medium',
      project_id: projectId,
    };

    if (description) taskData.description = description;
    if (due_date) taskData.due_date = due_date;
    if (organization_id) {
      taskData.organization_id = organization_id;
      taskData.visibility = 'organization';
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert(taskData)
      .select('id, title, project_id, priority, due_date')
      .single();

    if (taskError) {
      console.error('Error creating task:', taskError);
      return new Response(JSON.stringify({ error: 'Failed to create task', details: taskError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Task created via webhook:', task.id, task.title);

    return new Response(JSON.stringify({
      success: true,
      task,
      project: { id: projectId, name: targetProjectName },
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Task webhook error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
