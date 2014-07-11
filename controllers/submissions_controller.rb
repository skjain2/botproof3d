class SubmissionsController < ApplicationController
  before_action :set_submission, only: [:show, :edit, :update, :destroy]

  # GET /submissions
  # GET /submissions.json
  def index
    if params[:user_id] && user = User.find(params[:user_id])
      @submissions = Submission.find_all_by_user_id user.id
    else
      @submissions = Submission.all
    end
  end

  # GET /submissions/1
  # GET /submissions/1.json
  def show
  end

  # GET /submissions/new
  def new
    @submission = Submission.new
  end

  # GET /submissions/1/edit
  def edit
  end

  # POST /submissions
  # POST /submissions.json
  def create
    @submission = Submission.new(submission_params)

    respond_to do |format|
      if @submission.save
        create_repaired_mesh
        format.html { redirect_to @submission, notice: 'Submission was successfully created.' }
        #Renders the submission form in show.html.haml
        format.json { render action: 'show', status: :created, location: @submission }
      else
        format.html { render action: 'new' }
        format.json { render json: @submission.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /submissions/1
  # PATCH/PUT /submissions/1.json
  def update
    respond_to do |format|
      if @submission.update(submission_params)
        format.html { redirect_to @submission, notice: 'Submission was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: 'edit' }
        format.json { render json: @submission.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /submissions/1
  # DELETE /submissions/1.json
  def destroy
    @submission.destroy
    destroy_aws_assets
    respond_to do |format|
      format.html { redirect_to submissions_url }
      format.json { head :no_content }
    end
  end

  # POST /submissions/callback  SKJ
  def callback
  	#p "Callback"
  	update_submission_job_status
  	respond_to do |format|
        format.html { render action: "show", status: :created, location: @submission }
        format.json { render action: "show", status: :created, location: @submission}
    end
  end

  private

  	# Destroy files on AWS

  	def destroy_aws_assets
		# delete all of the objects in a bucket (optionally with a common prefix as shown)
  		todel = Bucket.objects(:prefix => "#{@submission.id}")
      #p todel.count
      #Delete <count> objects from the array (each disappears from array as deletion occurs)
      todel.count do
        #p todel[0]
        todel[0].delete
      end
  	end

  	# Callback for CPUsage
  	def update_submission_job_status
    	p "update_submission_job_status"
    		#Parse CPUsage response into Json
  		res=JSON.parse(request.body.read)
  		#p "Res: " + res["status"]
  		# Find Submission Record with Job ID and update Job status + runtime information
  		record = Submission.where(:job_id => res["job_id"]).first
  		record.job_status=res["status"]
  		record.job_start=res["job_start"]
  		record.job_end=res["job_end"]
  		record.job_bill=res["bill_time_minutes"]
  		record.save
  	end

    # Use callbacks to share common setup or constraints between actions.
    def set_submission
      @submission = Submission.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def submission_params
      params.require(:submission).permit(:user_id, :name, :rating, :orientation, :description, :image)
    end

    def create_repaired_mesh
      #{}`mkdir #{Rails.root}/meshes/#{@submission.id}`
      FileUtils.mkdir("#{Rails.root}/meshes/#{@submission.id}")
      generate

      #Save current submission
      @submission.save

    end

    def generate
    	#Copy {image_path} to AWS
    	puts "Entering Generate"
    	puts "#{@submission.id}/#{image_name}"
    	#AWS::S3::S3Object.store("#{@submission.id}/#{image_name}", open("#{image_path}"), 'botproof3d')
    	BPS3.store("#{@submission.id}/#{image_name}", open("#{image_path}"))

    	#Send off CPUsage job pointing to mesh name

  		uri = URI.parse("https://api.cpusage.com/job/exec")
  		http = Net::HTTP.new(uri.host, uri.port)
  		http.use_ssl = true
  		http.verify_mode = OpenSSL::SSL::VERIFY_NONE
  		request = Net::HTTP::Post.new("/v1.1/auth")
  		request.add_field('Content-Type', 'application/json; charset=utf-8')
  		#request.body = {'credentials' => {'username' => 'username', 'key' => 'key'}}
  		#outputdir = "magnolia"
  		#outputfileobj = "magnolia.obj"
  		#inputfile = "magnolia.stl"
  		#inputfileroot = "magnolia"

  		#TODO
  		#Need to figure out if we have OBJ or STL and select the right script

      if (image_name.count('stl') || image_name.count('STL'))
        executable = "objwf"
        image_stl = image_name+".stl"
      else
        executable = "stlwf"
        image_stl = image_name
      end

  		request.body = {
  		    "version_id" => "529e30e9d035487519000014",
  		    "execute_path"=> "/opt/cpusage/executer/cli-executer",
  		    "secret" => "0B7LkYHt0T-hErIQVTJyTlzejKM",
  		    "key" => "527abf428d31d35b730001b0",
  		    "callback" => "http://botproof3d.herokuapp.com/callback",
  		    "payload" => {
  			        "cmds" => [
  			            "/root/#{executable} \"#{@submission.id}\" \"#{image_name}\""
  			        ]
  			    }
  		    }.to_json
  		#puts request.body
  		#puts "Submitting CPUsage job"
  		http.request_post(uri.path,request.body, initheader = {'Content-Type'=> 'application/json; charset=utf-8'}) {|response|
  		  p response.body
  		  res=JSON.parse(response.body)
  		  #if successful, record job_ID, otherwise should record null or something
  		  @submission.job_id = res["job_id"]  # Save this to the object.
  		  @submission.job_status = "submitted"
  		  p response['content-type']
  		}

  		#Register callback to some function in here to build the resulting view
      	#View will need to be aware of status; if success, show the files on AWS and download link.
      	#If not, display status and resubmit button 
    end

    def convert_stl_to_obj
      command = "#{get_binary_path} -i #{image_path} -o #{Rails.root}/meshes/#{@submission.id}/#{image_name}.obj"
    end

    def image_name
      @submission.image.to_s.split("/").last
    end


    def image_path
      "#{Rails.root}/public/#{@submission.image}"
    end

    def aws_bucket
    	"botproof3d"
    end

    def get_binary_path
      if Rails.env == 'production'
        meshlabserver = 'xvfb-run -a /usr/bin/meshlabserver'
      else
        # meshlabserver = '/usr/local/bin/meshlabserver'
        meshlabserver = '/Applications/meshlab.app/Contents/MacOS/meshlabserver'
      end
    end
end
